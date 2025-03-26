// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform( positionX, positionY, rotation, scale )
{
	// scale array
	let S = [ scale, 0, 0, 0, scale, 0, 0, 0, 1 ];
	// rotation array
	let radians = rotation * Math.PI / 180;
	let R = [ Math.cos(radians), Math.sin(radians), 0, -Math.sin(radians), Math.cos(radians), 0, 0, 0, 1 ];
	// applying scale and rotation
	let trans = dot3x3(S, R);
	// translation
	trans[6] = positionX;
	trans[7] = positionY;

	return trans;
}

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies trans1 and then trans2.
function ApplyTransform( trans1, trans2 )
{	
	return dot3x3(trans2, trans1);
}

// row by column 3x3 matrix product
function dot3x3(array1, array2)
{
	let array3 = [1,0,0,0,1,0,0,0,1];
	for (let i = 0; i < 3; i++) {
		let index = i;
		for (let j = 0; j < 9; j+=3) {
			array3[index] = array1[i]*array2[j] + array1[i+3]*array2[j+1] + array1[i+6]*array2[j+2];
			index += 3;
		}
	}
	return array3;
}