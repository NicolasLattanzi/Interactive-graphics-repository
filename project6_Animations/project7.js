// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{
	let Rx = [ 1, 0, 0, 0,
		0, Math.cos(rotationX), Math.sin(rotationX), 0,
		0, -Math.sin(rotationX), Math.cos(rotationX), 0,
		0, 0, 0, 1 ];
	let Ry = [ Math.cos(rotationY), 0, -Math.sin(rotationY), 0,
			0, 1, 0, 0,
			Math.sin(rotationY), 0, Math.cos(rotationY), 0,
			0, 0, 0, 1 ];
	let rotation = MatrixMult(Ry, Rx);

	let trans = [];
	for (let i = 0; i < 12; i++) trans.push( rotation[i] );
	trans.push(translationX);
	trans.push(translationY);
	trans.push(translationZ);
	trans.push(1);

	return trans;
}


class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		this.prog = InitShaderProgram( this.verShader, this.fragShader );

		this.verPosLocation = gl.getAttribLocation(this.prog, 'verPos');
		this.texCoordLocation = gl.getAttribLocation(this.prog, 'texCoord');
		this.normalsLocation = gl.getAttribLocation(this.prog, 'normals');
		this.showTex = gl.getUniformLocation(this.prog, 'showTex'); 
		this.textureSelected = gl.getUniformLocation(this.prog, 'textureSelected');
		this.flipYZ = gl.getUniformLocation(this.prog, 'flipYZ');
		this.sampler = gl.getUniformLocation(this.prog, 'texture');

		this.mvpLocation = gl.getUniformLocation(this.prog, 'mvp');
		this.mvLocation = gl.getUniformLocation(this.prog, 'mv');
		this.normalMatrixLocation = gl.getUniformLocation(this.prog, 'matrixNormal');
		this.lightDir = gl.getUniformLocation(this.prog, 'lightDirection');
		this.shininess = gl.getUniformLocation(this.prog, 'shininess');

		gl.useProgram(this.prog);
		gl.uniform1i(this.flipYZ, false);
		gl.uniform1i(this.showTex, true);
		gl.uniform1i(this.textureSelected, false);
		gl.uniform1f(this.shininess, 100);

		this.numTriangles = 0;
		this.vertexBuffer = gl.createBuffer();
		this.texCoordBuffer = gl.createBuffer();
		this.normalBuffer = gl.createBuffer();
	}

	// Vertex shader source code
	verShader = `
		attribute vec3 verPos;
		attribute vec2 texCoord;
		attribute vec3 normals;

		uniform mat4 mvp;
		uniform mat4 mv;
		uniform mat3 matrixNormal;
		uniform bool flipYZ;
		uniform vec3 lightDirection;

		varying vec2 varTexCoords;
		varying vec3 v_normal; 
		varying vec3 v_pos;   

		void main()
		{	
			mat4 trans = mat4( 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1 );
			if (flipYZ){
				trans = mat4( 1,0,0,0, 0,0,1,0, 0,1,0,0, 0,0,0,1 );
			}
			varTexCoords = texCoord;

			gl_Position = mvp * trans * vec4(verPos,1);
			v_normal = normalize(matrixNormal * normals * mat3(trans));
			v_pos = vec3(mv * trans * vec4(verPos, 1.0)); 
		}
	`;

	// Fragment shader source code
	fragShader = `
		precision highp float;

		uniform bool showTex;
		uniform bool textureSelected;
		uniform sampler2D texture;
		uniform float shininess;
		uniform vec3 lightDirection;

		varying vec2 varTexCoords;
		varying vec3 v_normal;
		varying vec3 v_pos;    

		void main()
		{
			highp vec4 texelColor;
			if (showTex && textureSelected) {
				texelColor = texture2D( texture, varTexCoords );
			}
			else {
				texelColor = vec4(1,gl_FragCoord.z*gl_FragCoord.z,0,1);
			}

            vec4 lightColor = vec4(1.0, 1.0, 1.0, 1.0);
            vec4 ambientLight= vec4(texelColor.rgb, 1.0);

            float angle = dot(v_normal, lightDirection);
            vec4 diffuse = vec4(texelColor.rgb, 1.0) * clamp(angle, 0.0, 1.0);
            vec4 ambient = diffuse * ambientLight;

            vec3 reflection = 2.0 * dot(normalize(v_normal), lightDirection) * v_normal - lightDirection;
            reflection = normalize(reflection);
            vec3 view = normalize(vec3(-v_pos));

            float phi = dot(reflection, view);
            phi = clamp(phi, 0.0, 1.0);
            vec4 specular = lightColor * pow(phi, shininess);

            gl_FragColor = lightColor * (diffuse + specular) + ambient;
		}
	`;
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords, normals )
	{
		this.numTriangles = vertPos.length / 3;

		gl.useProgram(this.prog);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		gl.useProgram(this.prog);
		gl.uniform1i(this.flipYZ, swap)
	}
	
	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		gl.useProgram( this.prog );

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.vertexAttribPointer(this.verPosLocation, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.verPosLocation);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.vertexAttribPointer(this.texCoordLocation, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.texCoordLocation);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.vertexAttribPointer(this.normalsLocation, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.normalsLocation);
		
		gl.uniformMatrix4fv(this.mvpLocation, false, matrixMVP);
		gl.uniformMatrix4fv(this.mvLocation, false, matrixMV);
		gl.uniformMatrix3fv(this.normalMatrixLocation, false, matrixNormal);

		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		gl.useProgram(this.prog);

		const texture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture( gl.TEXTURE_2D, texture );

		// You can set the texture image data using the following command.
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );

		gl.generateMipmap(gl.TEXTURE_2D);
		
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

		gl.uniform1i(this.sampler, 0);
		gl.uniform1i(this.textureSelected, true)
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		gl.useProgram(this.prog);
		gl.uniform1i(this.showTex, show)
	}
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		gl.useProgram(this.prog);
		gl.uniform3f(this.lightDir, x, y, z);
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		gl.useProgram(this.prog);
		gl.uniform1f(this.shininess, shininess);
	}
}


// This function is called for every step of the simulation.
// Its job is to advance the simulation for the given time step duration dt.
// It updates the given positions and velocities.
function SimTimeStep( dt, positions, velocities, springs, stiffness, damping, particleMass, gravity, restitution )
{
	var forces = Array( positions.length ); // The total for per particle

	// [TO-DO] Compute the total force of each particle
	for (let i = 0; i < forces.length; i++) {
		forces[i] = gravity.mul(particleMass);
	}
	
    for (let s = 0; s < springs.length; s++) {
        let spring = springs[s];
		let pos0 = positions[spring.p0], pos1 = positions[spring.p1]
		let vel0 = velocities[spring.p0], vel1 = velocities[spring.p1]

		let springLength = pos1.sub(pos0).len();
		let springDirection = pos1.sub(pos0).div(springLength); 

        // spring force
        let springForce = springDirection.mul(stiffness * (springLength - spring.rest));

		forces[spring.p0] = forces[spring.p0].add(springForce); 
		forces[spring.p1] = forces[spring.p1].add(springForce.mul(-1.0));

        // damping force
        let changeSpeed = vel1.sub(vel0).dot(springDirection);
        let dampingForce = springDirection.mul(damping).mul(changeSpeed);

		forces[spring.p0] = forces[spring.p0].add(dampingForce); 
		forces[spring.p1] = forces[spring.p1].add(dampingForce.mul(-1.0));
    }

	// [TO-DO] Update positions and velocities
    for (let i = 0; i < positions.length; i++) {
		// a = F / m
        let acc = forces[i].div(particleMass).add(gravity);
		
        velocities[i].inc(acc.mul(dt));
        positions[i].inc(velocities[i].mul(dt));
    }

	// [TO-DO] Handle collisions
    for (let i = 0; i < positions.length; i++) {
        for (let axis of ['x', 'y', 'z']) {
            if (positions[i][axis] < -1) {
                positions[i][axis] = -1;
                if (velocities[i][axis] < 0) velocities[i][axis] *= -restitution;
            }
            if (positions[i][axis] > 1) {
                positions[i][axis] = 1;
                if (velocities[i][axis] > 0) velocities[i][axis] *= -restitution;
            }
        }
    }
}


