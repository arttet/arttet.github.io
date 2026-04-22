struct Uniforms {
	uPointScale : f32,
	uTime       : f32,
	uResolution : vec2<f32>,
};

@group(0) @binding(0) var<uniform> u : Uniforms;

struct VSIn {
	@location(0) aPosition : vec2<f32>,
	@location(1) aColor    : vec4<f32>,
};

struct VSOut {
	@builtin(position) sv_position : vec4<f32>,
	@location(0) vColor            : vec4<f32>,
	@location(1) vPointCoord       : vec2<f32>,
};

@vertex
fn vertexMain(
	input : VSIn,
	@builtin(vertex_index) vertexIndex : u32,
) -> VSOut {
	var o : VSOut;
	o.vColor = input.aColor;

	var offset = vec2<f32>(0.0);
	if (vertexIndex == 0u) { offset = vec2<f32>(-1.0, -1.0); }
	if (vertexIndex == 1u) { offset = vec2<f32>( 1.0, -1.0); }
	if (vertexIndex == 2u) { offset = vec2<f32>(-1.0,  1.0); }
	if (vertexIndex == 3u) { offset = vec2<f32>( 1.0,  1.0); }

	o.vPointCoord = offset * 0.5 + 0.5;

	// Scale relative to height for consistency
	let sizeNDC = (u.uPointScale * 2.0) / u.uResolution.y;

	o.sv_position = vec4<f32>(input.aPosition + offset * sizeNDC, 0.0, 1.0);
	return o;
}

@fragment
fn fragmentMain(input : VSOut) -> @location(0) vec4<f32> {
	let dist = length(input.vPointCoord - 0.5) * 2.0;
	if (dist > 1.0) { discard; }

	let edge = 1.0 - smoothstep(0.7, 1.0, dist);
	let alpha = input.vColor.a * edge;
	return vec4<f32>(input.vColor.rgb, alpha);
}
