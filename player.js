let Player = class {
    constructor(gl, pos) {
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        this.positions = [
             // Front face
             -1.0, -1.0, 1.0,
             1.0, -1.0, 1.0,
             1.0, 1.0, 1.0,
             -1.0, 1.0, 1.0,
             //Back Face
             -1.0, -1.0, -1.0,
             1.0, -1.0, -1.0,
             1.0, 1.0, -1.0,
             -1.0, 1.0, -1.0,
             //Top Face
             -1.0, 1.0, -1.0,
             1.0, 1.0, -1.0,
             1.0, 1.0, 1.0,
             -1.0, 1.0, 1.0,
             //Bottom Face
             -1.0, -1.0, -1.0,
             1.0, -1.0, -1.0,
             1.0, -1.0, 1.0,
             -1.0, -1.0, 1.0,
             //Left Face
             -1.0, -1.0, -1.0,
             -1.0, 1.0, -1.0,
             -1.0, 1.0, 1.0,
             -1.0, -1.0, 1.0,
             //Right Face
             1.0, -1.0, -1.0,
             1.0, 1.0, -1.0,
             1.0, 1.0, 1.0,
             1.0, -1.0, 1.0,
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.positions), gl.STATIC_DRAW);

        this.speed = [0, 0, -0.1];
        this.acc = [0, -0.016, -0.001];
        this.rotation = 0;
        this.hasMagnet = false;
        this.maxheight = 15;
        this.hasFlyBoost = false;
        this.hasBoot = false;
        this.pos = pos;
        this.smljmpspd = 0.3;
        this.lrgjmpspd = 0.6;

        const txture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, txture);
        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 1;
        const height = 1;
        const border = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);

        const image = new Image();
        image.onload = function() {
            gl.bindTexture(gl.TEXTURE_2D, txture);
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);

            if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
               gl.generateMipmap(gl.TEXTURE_2D);
            } else {
               // No, it's not a power of 2. Turn off mips and set
               // wrapping to clamp to edge
               gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
               gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
               gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }
        };
        image.src = "baller.jpg";

        this.texture = txture;
        const textureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
        const textureCoordinates = [
            1,  1,
            0.0,  1,
            0.0,  0.0,
            1,  0.0,

            0.0,  0.0,
            1,  0.0,
            1,  1,
            0.0,  1,

            0.0,  0.0,
            1,  0.0,
            1,  1,
            0.0,  1,

            0.0,  0.0,
            1,  0.0,
            1,  1,
            0.0,  1,

            0.0,  0.0,
            1,  0.0,
            1,  1,
            0.0,  1,

            0.0,  0.0,
            1,  0.0,
            1,  1,
            0.0,  1
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),gl.STATIC_DRAW);

        
        // this.faceColors = [
        //     [0,  0,  1,  1.0],
        // ];

        // var colors = [];

        // for (var j = 0; j < this.faceColors.length; ++j) {
        //     const c = this.faceColors[j];

        //     // Repeat each color four times for the four vertices of the face
        //     colors = colors.concat(c, c, c, c);
        // }

        // const colorBuffer = gl.createBuffer();
        // gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

        // Build the element array buffer; this specifies the indices
        // into the vertex arrays for each face's vertices.

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        // This array defines each face as two triangles, using the
        // indices into the vertex array to specify each triangle's
        // position.

        const indices = [
            0, 1, 2,    0, 2, 3, // front
            4, 5, 6,    4, 6, 7,
            8, 9, 10,   8, 10, 11,
            12, 13, 14, 12, 14, 15,
            16, 17, 18, 16, 18, 19,
            20, 21, 22, 20, 22, 23, 
        ];

        // Now send the element array to GL

        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(indices), gl.STATIC_DRAW);

        this.buffer = {
            position: this.positionBuffer,
            textureCoord: textureCoordBuffer,
            // color: colorBuffer,
            indices: indexBuffer,
        }

    }

    draw(gl, projectionMatrix, programInfo, deltaTime) {
        const modelViewMatrix = mat4.create();
        mat4.translate(
            modelViewMatrix,
            modelViewMatrix,
            this.pos
        );


        mat4.rotate(modelViewMatrix,
            modelViewMatrix,
            this.rotation,
            [1, 0, 0]);
        
        {
            const numComponents = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.position);
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexPosition,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(
                programInfo.attribLocations.vertexPosition);
        }

        // Tell WebGL how to pull out the colors from the color buffer
        // into the vertexColor attribute.
        // {
        //     const numComponents = 4;
        //     const type = gl.FLOAT;
        //     const normalize = false;
        //     const stride = 0;
        //     const offset = 0;
        //     gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.color);
        //     gl.vertexAttribPointer(
        //         programInfo.attribLocations.vertexColor,
        //         numComponents,
        //         type,
        //         normalize,
        //         stride,
        //         offset);
        //     gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
        // }


        // tell webgl how to pull out the texture coordinates from buffer
        {
            const num = 2; // every coordinate composed of 2 values
            const type = gl.FLOAT; // the data in the buffer is 32 bit float
            const normalize = false; // don't normalize
            const stride = 0; // how many bytes to get from one set to the next
            const offset = 0; // how many bytes inside the buffer to start from
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.textureCoord);
            gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, num, type, normalize, stride, offset);
            gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
        }

        // Tell WebGL which indices to use to index the vertices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer.indices);

        // Tell WebGL to use our program when drawing

        gl.useProgram(programInfo.program);
        
        // Tell WebGL we want to affect texture unit 0
        gl.activeTexture(gl.TEXTURE0);

        // Bind the texture to texture unit 0
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        // Tell the shader we bound the texture to texture unit 0
        gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

        // Set the shader uniforms

        gl.uniformMatrix4fv(
            programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix);
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix);

        {
            const vertexCount = 36;
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        }

    }
    tick() {
        this.pos[0] += this.speed[0];
        this.pos[1] += this.speed[1];
        this.pos[2] += this.speed[2];
        if (this.speed[1] != 0 && (this.hasFlyBoost == false)) {
            this.speed[1] += this.acc[1];
        }
        if (this.speed[1] != 0 && (this.hasFlyBoost == true) && this.pos[1] >= this.maxheight) {
            this.pos[1] = this.maxheight;
            this.speed[1] = 0;
        }
        if (Math.abs(this.speed[2]) < 0.8 && (this.hasFlyBoost == false)) {
            this.speed[2] += this.acc[2];
        }
    }
};