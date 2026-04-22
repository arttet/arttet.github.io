@group(0) @binding(0) var uScene: texture_2d<f32>;
@group(0) @binding(1) var uSampler: sampler;

// Blit pass
struct BlitVSOut {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
};

@vertex
fn blitVS(@builtin(vertex_index) vi: u32) -> BlitVSOut {
    // Full-screen triangle-strip quad covering NDC [-1,1]
    let xs = array<f32, 4>(-1.0, 1.0, -1.0, 1.0);
    let ys = array<f32, 4>( 1.0, 1.0, -1.0,-1.0);
    let x = xs[vi];
    let y = ys[vi];
    var out: BlitVSOut;
    out.position = vec4<f32>(x, y, 0.0, 1.0);
    out.uv = vec2<f32>((x + 1.0) * 0.5, (1.0 - y) * 0.5);
    return out;
}

@fragment
fn blitFS(in: BlitVSOut) -> @location(0) vec4<f32> {
    return textureSample(uScene, uSampler, in.uv);
}

// Glass pass
struct GlassUniforms {
    rect:       vec4<f32>,  // x, y, w, h in pixels
    resolution: vec2<f32>,
    time:       f32,
    themeMode:  f32,        // 1.0 = dark, 0.0 = light
    bgColor:    vec4<f32>,  // rgb = page background color, a unused
};

@group(1) @binding(0) var<uniform> uGlass: GlassUniforms;

struct GlassVSOut {
    @builtin(position) position: vec4<f32>,
    @location(0) uv:      vec2<f32>,   // screen UV [0,1]
    @location(1) localUV: vec2<f32>,   // rect-local [-1,1]
};

@vertex
fn glassVS(@builtin(vertex_index) vi: u32) -> GlassVSOut {
    let xs = array<f32, 4>(0.0, 1.0, 0.0, 1.0);
    let ys = array<f32, 4>(1.0, 1.0, 0.0, 0.0);

    let rx = uGlass.rect.x;
    let ry = uGlass.rect.y;
    let rw = uGlass.rect.z;
    let rh = uGlass.rect.w;
    let W  = uGlass.resolution.x;
    let H  = uGlass.resolution.y;

    let px = rx + xs[vi] * rw;
    let py = ry + ys[vi] * rh;

    // Pixel → NDC (Y-flip: pixel y=0 is top)
    let ndcX =  (px / W) * 2.0 - 1.0;
    let ndcY = -(py / H) * 2.0 + 1.0;

    // Screen UV for scene sample
    let screenU = px / W;
    let screenV = py / H;

    // Local UV centered at 0, range [-1,1]
    let localU = xs[vi] * 2.0 - 1.0;
    let localV = ys[vi] * 2.0 - 1.0;

    var out: GlassVSOut;
    out.position = vec4<f32>(ndcX, ndcY, 0.0, 1.0);
    out.uv       = vec2<f32>(screenU, screenV);
    out.localUV  = vec2<f32>(localU, localV);
    return out;
}

@fragment
fn glassFS(in: GlassVSOut) -> @location(0) vec4<f32> {
    let t   = uGlass.time;
    let luv = in.localUV;

    // Sinusoidal distortion field — gentle ripple
    let dx = sin(luv.y * 3.1 + t * 0.7) * 0.012
           + sin(luv.x * 2.3 + t * 0.5) * 0.006;
    let dy = cos(luv.x * 2.7 + t * 0.6) * 0.012
           + cos(luv.y * 1.9 + t * 0.4) * 0.006;

    let refractedUV = in.uv + vec2<f32>(dx, dy);
    let sampled     = textureSample(uScene, uSampler, refractedUV);
    
    // Composite particles over the page background color
    let scene = sampled.rgb + uGlass.bgColor.rgb * (1.0 - min(sampled.a, 1.0));

    // Consistent minimal tint for pure transparency
    let tint = vec3<f32>(0.65, 0.85, 1.0); // cold blue
    let tintFactor = 0.03;
    let tinted = mix(scene, tint, tintFactor);

    // Fresnel rim — brighter near edges
    let edgeDist = 1.0 - max(abs(luv.x), abs(luv.y));
    let fresnel  = pow(max(0.0, 1.0 - edgeDist * 2.5), 3.0) * 0.45;

    let rgb = tinted + vec3<f32>(fresnel);
    return vec4<f32>(rgb, 0.88);
}
