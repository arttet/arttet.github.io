// edges.wgsl — Delaunay edge lines rendered as quads with gradient colors
struct Uniforms {
	uEdgeOpacity : f32,
	uEdgeWidth   : f32,
	uResolution  : vec2<f32>,
};

@group(0) @binding(0) var<uniform> u : Uniforms;

struct VSIn {
	@location(0) aStartPos  : vec2<f32>,
	@location(1) aEndPos    : vec2<f32>,
	@location(2) aStartCol  : vec4<f32>,
	@location(3) aEndCol    : vec4<f32>,
};

struct VSOut {
	@builtin(position) sv_position : vec4<f32>,
	@location(0) vColor            : vec3<f32>,
	@location(1) vAlpha            : f32,
};

@vertex
fn vertexMain(
	input : VSIn,
	@builtin(vertex_index) vertexIndex : u32,
) -> VSOut {
	var o : VSOut;

	let aspect = u.uResolution.x / u.uResolution.y;
	let startScreen = input.aStartPos * vec2<f32>(aspect, 1.0);
	let endScreen = input.aEndPos * vec2<f32>(aspect, 1.0);
	let dir = normalize(endScreen - startScreen);

	let perpScreen = vec2<f32>(-dir.y, dir.x);
	// Convert thickness to NDC-relative space
	let perp = (perpScreen / vec2<f32>(aspect, 1.0)) * (u.uEdgeWidth / u.uResolution.y);

	var offset = vec2<f32>(0.0);
	var t : f32 = 0.0;

	if (vertexIndex == 0u) { offset =  perp; t = 0.0; } // BL
	if (vertexIndex == 1u) { offset = -perp; t = 0.0; } // TL
	if (vertexIndex == 2u) { offset =  perp; t = 1.0; } // BR
	if (vertexIndex == 3u) { offset = -perp; t = 1.0; } // TR

	let pos = select(input.aStartPos, input.aEndPos, t >= 0.5) + offset;

	o.vColor = mix(input.aStartCol.rgb, input.aEndCol.rgb, t);
	o.vAlpha = mix(input.aStartCol.a, input.aEndCol.a, t);

	o.sv_position = vec4<f32>(pos, 0.0, 1.0);
	return o;
}

@fragment
fn fragmentMain(input : VSOut) -> @location(0) vec4<f32> {
	let alpha = input.vAlpha * u.uEdgeOpacity;
	return vec4<f32>(input.vColor, alpha);
}
