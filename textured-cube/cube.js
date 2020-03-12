const mat4 = glMatrix.mat4;

var cubeRotation = 0.0;

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
    var then = 0;

    // drawScene(gl, programInfo, buffers);
    function render(now) {
        now *= 0.001;
        const deltaTime = now - then;
        then = now;
    
        drawScene(gl, programInfo, buffers, deltaTime);
    
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

}

// create the vertex buffers
function initBuffers(gl) {
    // create buffer
    const positionBuffer = gl.createBuffer();
    // bind buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = [
        // Front face
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,
        
        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0, -1.0, -1.0,
        
        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,
        
        // Bottom face
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,
        
        // Right face
         1.0, -1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0, -1.0,  1.0,
        
        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0,
    ];

    const faceColors = [
        [1.0, 0.0, 0.0, 1.0],
        [0.0, 1.0, 0.0, 1.0],
        [1.0, 0.0, 1.0, 1.0],
        [1.0, 1.0, 1.0, 1.0],
        [0.0, 1.0, 1.0, 1.0],
        [1.0, 0.0, 1.0, 1.0],
    ];

    var colors = [];

    faceColors.forEach( (elem) => {
        colors = colors.concat(elem, elem, elem, elem);
    });

    // send positions to buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    // ccw triangles
    const indices = [
        0, 1, 2,    0, 2, 3,        // front
        4, 5, 6,    4, 6, 7,        // back
        8, 9, 10,   8, 10, 11,      // top
        12, 13, 14, 12, 14, 15,     // bottom
        16, 17, 18, 16, 18, 19,     // right
        20, 21, 22, 20, 22, 23      // left
    ];

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        color: colorBuffer,
        indices: indexBuffer,
    };
}

function drawScene(gl, programInfo, buffers, deltaTime) {
    // clear color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // clear to black
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

    mat4.rotate(modelViewMatrix,
                modelViewMatrix,
                cubeRotation,
                [0, 0, 1]);
    mat4.rotate(modelViewMatrix,
                modelViewMatrix,
                cubeRotation * .7,
                [0, 1, 0]);
    
    {
        const numComponents = 3;    // how many values per iteration. this is a 2d object so 2 coords
        const type = gl.FLOAT;      // the data in the buffer
        const normalize = false;    // don't normalize
        const stride = 0;           // how many bytes to get one value to the next
                                    // 0 = use type and numComponents above
        const offset = 0;           // how many bytes inside buffer to start from

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexPos,
                                numComponents,
                                type,
                                normalize,
                                stride,
                                offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPos);
    }
    {
        const numComponents = 4;    // how many values per iteration. this is a 2d object so 2 coords
        const type = gl.FLOAT;      // the data in the buffer
        const normalize = false;    // don't normalize
        const stride = 0;           // how many bytes to get one value to the next
                                    // 0 = use type and numComponents above
        const offset = 0;           // how many bytes inside buffer to start from

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexColor,
                                numComponents,
                                type,
                                normalize,
                                stride,
                                offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

    gl.useProgram(programInfo.program);
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix,
                        false,
                        projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix,
                        false,
                        modelViewMatrix);


  {
    const vertexCount = 36;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }
    cubeRotation += deltaTime;
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

function loadTexture(gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([])
}


// calling the main on load
window.onload = main;