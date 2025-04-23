// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
function GetModelViewProjection( projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY )
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

	var mvp = MatrixMult( projectionMatrix, trans );
	return mvp;
}


// [TO-DO] Complete the implementation of the following class.

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// [TO-DO] initializations
		this.prog = InitShaderProgram( this.verShader, this.fragShader );

		this.verPosLocation = gl.getAttribLocation(this.prog, 'verPos');
		this.texCoordLocation = gl.getAttribLocation(this.prog, 'texCoord');
		this.showTex = gl.getUniformLocation(this.prog, 'showTex'); 
		this.textureSelected = gl.getUniformLocation(this.prog, 'textureSelected');
		this.flipYZ = gl.getUniformLocation(this.prog, 'flipYZ');
		this.mvp = gl.getUniformLocation(this.prog, 'mvp');
		this.sampler = gl.getUniformLocation(this.prog, 'texture');

		gl.useProgram(this.prog);
		gl.uniform1i(this.flipYZ, false);
		gl.uniform1i(this.showTex, true);
		gl.uniform1i(this.textureSelected, false);

		this.numTriangles = 0;
		this.vertexBuffer = gl.createBuffer();
		this.texCoordBuffer = gl.createBuffer();
	}

	// Vertex shader source code
	verShader = `
		attribute vec3 verPos;
		attribute vec2 texCoord;
		uniform mat4 mvp;
		uniform bool flipYZ;
		varying vec2 varTexCoords;

		void main()
		{	
			if (!flipYZ){
				gl_Position = mvp * vec4(verPos,1);
			}
			else {
				gl_Position = mvp * mat4( 1,0,0,0, 0,0,1,0, 0,1,0,0, 0,0,0,1 ) * vec4(verPos,1);
			}
			varTexCoords = texCoord;
		}
	`;
	// Fragment shader source code
	fragShader = `
		precision highp float;
		uniform bool showTex;
		uniform bool textureSelected;
		uniform sampler2D texture;
		varying vec2 varTexCoords;

		void main()
		{
			if (showTex && textureSelected) {
				gl_FragColor = texture2D( texture, varTexCoords );
			}
			else {
				gl_FragColor = vec4(1,gl_FragCoord.z*gl_FragCoord.z,0,1);
			}
		}
	`;

	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions
	// and an array of 2D texture coordinates.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex.
	// Note that this method can be called multiple times.
	setMesh(vertPos, texCoords) {
		// [TO-DO] Update the contents of the vertex buffer objects.
		this.numTriangles = vertPos.length / 3;

		gl.useProgram(this.prog);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		// [TO-DO] Set the uniform parameter(s) of the vertex shader
		gl.useProgram(this.prog);
		gl.uniform1i(this.flipYZ, swap)
	}
	
	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw( trans )
	{
		// [TO-DO] Complete the WebGL initializations before drawing
		gl.useProgram( this.prog );

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.vertexAttribPointer(this.verPosLocation, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.verPosLocation);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.vertexAttribPointer(this.texCoordLocation, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.texCoordLocation);
		
		gl.uniformMatrix4fv(this.mvp, false, trans);

		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );
	}	

	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		// [TO-DO] Bind the texture
		gl.useProgram(this.prog);

		const texture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture( gl.TEXTURE_2D, texture );

		// You can set the texture image data using the following command.
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );

		gl.generateMipmap(gl.TEXTURE_2D);
		
		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
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
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
		gl.useProgram(this.prog);
		gl.uniform1i(this.showTex, show)
	}
	
}
