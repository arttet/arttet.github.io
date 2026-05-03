// triangles.wgsl — Delaunay triangle face fill (additive glow)
struct Uniforms {
	uOpacity    : f32,
	_pad0       : f32,
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
};

@vertex
fn vertexMain(input: VSIn) -> VSOut {
	var o: VSOut;
	o.sv_position = vec4<f32>(input.aPosition, 0.0, 1.0);
	o.vColor = input.aColor;
	return o;
}

@fragment
fn fragmentMain(input: VSOut) -> @location(0) vec4<f32> {
	return vec4<f32>(input.vColor.rgb, input.vColor.a * u.uOpacity);
}
