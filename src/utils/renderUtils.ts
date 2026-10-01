import { float3, mat4x4 } from './threeUtils';

export function getLineMatrix(
	p0: float3,
	p1: float3,
	width: number = 0.1,
	result = new mat4x4()): mat4x4 {
	const dir = new float3().subVectors(p1, p0);
	const dirNorm = dir.clone().normalize();

	// The line model is oriented along the y-dir
	const refVec = Math.abs(dirNorm.y) > 0.99
		? new float3(1, 0, 0) // line is along y-axis, so use x-axis as reference
		: new float3(0, 1, 0);
	const right = new float3()
		.crossVectors(dirNorm, refVec)
		.normalize()
		.multiplyScalar(width);
	const forward = new float3()
		.crossVectors(right, dirNorm);

	return result.set(
		right.x, dir.x * 4, forward.x, p0.x,
		right.y, dir.y * 4, forward.y, p0.y,
		right.z, dir.z * 4, forward.z, p0.z,
		0, 0, 0, 1
	);
}
