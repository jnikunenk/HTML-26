const triangleVertWGSL = `
@vertex
fn main(
  @builtin(vertex_index) VertexIndex : u32
) -> @builtin(position) vec4f {
  var pos = array<vec2f, 3>(
    vec2(0.0, 0.5),
    vec2(-0.5, -0.5),
    vec2(0.5, -0.5)
  );

  return vec4f(pos[VertexIndex], 0.0, 1.0);
}
`

const redFragWGSL = `
@fragment
fn main() -> @location(0) vec4f {
  return vec4(1.0, 0.0, 0.0, 1.0);
}
`

async function init() {
    if (!navigator.gpu) {
        throw Error("WebGPU not supported.");
    }

    let adapter;
    try {
        adapter = await navigator.gpu.requestAdapter();
    } catch (error) {
        console.error(error);
    }
    if (!adapter) {
        throw Error("Couldn't request WebGPU adapter.");
    }

    const device = await adapter.requestDevice();
    console.log(navigator.gpu);
    console.log(adapter);
    console.log(device);

    navigator.gpu.wgslLanguageFeatures.forEach(feature => {
        console.log(feature);
    });

    Array.from(document.getElementsByClassName("gpu-lang-features")).forEach(element => {
        navigator.gpu.wgslLanguageFeatures.forEach(feature => {
            element.innerHTML += `<p>${feature}</p>`;
        });
    });

    const gpuName = device.adapterInfo.vendor + " " +
        device.adapterInfo.architecture;

    console.log(gpuName);

    Array.from(document.getElementsByClassName("gpu-name")).forEach(element => {
        element.textContent = gpuName;
    });

    {
        const canvas = document.querySelector('canvas');

        const context = canvas.getContext('webgpu');

        const devicePixelRatio = window.devicePixelRatio;
        canvas.width = canvas.clientWidth * devicePixelRatio;
        canvas.height = canvas.clientHeight * devicePixelRatio;
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

        context.configure({
            device,
            format: presentationFormat,
        });

        const pipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: device.createShaderModule({
                    code: triangleVertWGSL,
                }),
            },
            fragment: {
                module: device.createShaderModule({
                    code: redFragWGSL,
                }),
                targets: [
                    {
                        format: presentationFormat,
                    },
                ],
            },
            primitive: {
                topology: 'triangle-list',
            },
        });

        function frame() {
            const commandEncoder = device.createCommandEncoder();
            const textureView = context.getCurrentTexture().createView();

            const renderPassDescriptor = {
                colorAttachments: [
                    {
                        view: textureView,
                        clearValue: [0, 0, 0, 0], // Clear to transparent
                        loadOp: 'clear',
                        storeOp: 'store',
                    },
                ],
            };

            const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
            passEncoder.setPipeline(pipeline);
            passEncoder.draw(3);
            passEncoder.end();

            device.queue.submit([commandEncoder.finish()]);
            requestAnimationFrame(frame);
        }

        requestAnimationFrame(frame);
    }
}

init();

// Array.from(document.getElementsByClassName("code-lang-c")).forEach(element => {
//     element.innerHTML = element.textContent.replaceAll("int", "<em>int</em>");
// });