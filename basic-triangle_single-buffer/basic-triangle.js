/* 
 * Basic triangle
 * Uses a single interleaved buffer object for position and color
 */


const mat4 = glMatrix.mat4;

function main() {
    // get canvas
    const canvas = document.querySelector("#game-canvas");
    // get webgl context on canvas
    const gl = canvas.getContext("webgl");

    // error checking
    if(gl === null) {
        console.log("error with webgl context");
        return;
    }

    const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec4 aVertexColor;

        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;

        varying lowp vec4 vColor;
        void main() {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
            vColor = aVertexColor;
        }
    `;

    const fsSource = `
        varying lowp vec4 vColor;

        void main() {
            gl_FragColor = vColor;
        }
    `;

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    // get the locations that webgl assigned to attributes and uniforms in the shader program
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPos: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor')
        },
        uniformLocations: {
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
        }
    };

    const buffers = initBuffers(gl);

    drawScene(gl, programInfo, buffers);

}

// create the vertex buffers
function initBuffers(gl) {
    // create buffer
    const vertexBuffer = gl.createBuffer();
    // bind buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    const vertexArr = [
        // first three values for position, next 4 values for color
        -1.0, -1.0, 1.0, 1.0, 0.0, 0.0, 1.0,
         0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 1.0,
         1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 1.0,
    ];

    // send positions to buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexArr), gl.STATIC_DRAW);
    return {
        vert: vertexBuffer,
    }
}

function drawScene(gl, programInfo, buffers, deltaTime) {
    // clear color
    gl.clearColor(0.9, 0.9, 0.9, 1.0);  // clear to black
    gl.clearDepth(1.0);                 // clear everything
    gl.enable(gl.DEPTH_TEST);           // enable depth testing
    gl.depthFunc(gl.LEQUAL);            // near things obscure far things

    // clear buffer bits
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // create a perspective matrix
    // it's used to distort the perspective of a camera
    // our field of view is 45 degrees with a ratio that matches the display of the canvas
    // we want to see objects between 0.1 and 100.0 units away from the camera
    const fieldOfView = 45 * Math.PI / 180; // 
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    mat4.perspective(projectionMatrix,
         fieldOfView,
         aspect,
         zNear,
         zFar);
    
    // set the drawing position to where we want to start drawing the plane
    const modelViewMatrix = mat4.create();

    mat4.translate(modelViewMatrix,     // destination matrix
                    modelViewMatrix,     // matrix to translate
                    [-0.0, 0.0, -6.0]);
    
    {
        const numComponents = 3;    // how many values per iteration
        const type = gl.FLOAT;      // the data in the buffer
        const normalize = false;    // don't normalize
        const stride = 7*Float32Array.BYTES_PER_ELEMENT;   // how many bytes to get one value to the next
                                    // 0 = use type and numComponents above
        const offset = 0;           // how many bytes inside buffer to start from

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vert);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexPos,
                                numComponents,
                                type,
                                normalize,
                                stride,
                                offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPos);
    }
    {
        const numComponents = 4;    // how many values per iteration. color has 4 values
        const type = gl.FLOAT;      // the data in the buffer
        const normalize = false;    // don't normalize
        const stride = 7*Float32Array.BYTES_PER_ELEMENT;  // how many bytes to get one value to the next
                                    // 0 = use type and numComponents above
        const offset = 3*Float32Array.BYTES_PER_ELEMENT;           // how many bytes inside buffer to start from
        
        gl.vertexAttribPointer(programInfo.attribLocations.vertexColor,
                                numComponents,
                                type,
                                normalize,
                                stride,
                                offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
    }

    gl.useProgram(programInfo.program);
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix,
                        false,
                        projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix,
                        false,
                        modelViewMatrix);

    {
        const offset = 0;
        const vertexCount = 3;
        gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
    }
}

// setting up the shaders
function initShaderProgram(gl, vertexSrc, fragmentSrc) {
    // load shaders
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexSrc);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);

    // create a new empty shader program object
    const shaderProgram = gl.createProgram();

    // attach shaders to the program
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);

    // link the program
    gl.linkProgram(shaderProgram);

    // error check
    if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.log("error linking program");
        return null;
    }
    return shaderProgram;
}

// load the shader
function loadShader(gl, type, src) {
    // create a new empty shader object
    const shader = gl.createShader(type);
    // send source to shader
    gl.shaderSource(shader, src);
    // compile the shader
    gl.compileShader(shader);
    // error checking
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log(`error with ${src}`);
        gl.deleteShader(shader);
        return;
    }
    return shader;
}


// calling the main on load
window.onload = main;