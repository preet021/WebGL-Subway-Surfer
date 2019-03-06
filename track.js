/// <reference path="webgl.d.ts" />

let Track = class {
    constructor(gl, pos) {
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);

        this.positions = [
             -0.8, -0.1, 0,
             -1.1, -0.1, 0,
             -1.1, -0.1, -99999,
             -0.8, -0.1, -99999,

             0.8, -0.1, 0,
             1.1, -0.1, 0,
             1.1, -0.1, -99999,
             0.8, -0.1, -99999,
        ];

        var z = -2;
        for (; z>-9999; z-=6) {
            this.positions.push(-1.3);
            this.positions.push(0.0);
            this.positions.push(z);

            this.positions.push(1.3);
            this.positions.push(0.0);
            this.positions.push(z);

            this.positions.push(1.3);
            this.positions.push(0.0);
            this.positions.push(z-1);

            this.positions.push(-1.3);
            this.positions.push(0.0);
            this.positions.push(z-1);
        }

        this.positions.push(-10000, -0.2, 10, 10000, -0.2, 10, 1000, 0.2, -99999, -1000, -0.2, -99999);
        this.positions.push(-99999, -100, -99999, -99999, 99999, -99999, 99999, 99999, -99999, 99999, -100, -99999);

        this.rotation = 0;

        this.pos = pos;

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.positions), gl.STATIC_DRAW);
        
        this.faceColors = [
            [0, 0, 0, 1.0],
            [0, 0, 0, 1.0]
        ];

        for (var i=24; i<this.positions.length-24; i+=12) {
            this.faceColors.push([0.65, 0.247, 0.0156, 1.0]);
        }
        this.faceColors.push([0.537, 0.87, 0.0352, 1.0]);
        this.faceColors.push([0.22, 0.866, 0.96, 1.0]);

        var colors = [];

        for (var j = 0; j < this.faceColors.length; ++j) {
            const c = this.faceColors[j];
            // Repeat each color four times for the four vertices of the face
            colors = colors.concat(c, c, c, c);
        }

        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

        // Build the element array buffer; this specifies the indices
        // into the vertex arrays for each face's vertices.

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        // This array defines each face as two triangles, using the
        // indices into the vertex array to specify each triangle's
        // position.

        var indices = [
            0, 1, 2,    0, 2, 3,
            4, 5, 6,    4, 6, 7
        ];

        for (var i=8; i<this.positions.length; i+=4) {
            indices.push(i);
            indices.push(i+1);
            indices.push(i+2);

            indices.push(i);
            indices.push(i+2);
            indices.push(i+3);
        }

        // Now send the element array to GL

        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(indices), gl.STATIC_DRAW);

        this.buffer = {
            position: this.positionBuffer,
            color: colorBuffer,
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
        
        //this.rotation += Math.PI / (((Math.random()) % 100) + 50);

        // mat4.rotate(modelViewMatrix,
        //     modelViewMatrix,
        //     this.rotation,
        //     [1, 1, 1]);

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
        {
            const numComponents = 4;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.color);
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexColor,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(
                programInfo.attribLocations.vertexColor);
        }

        // Tell WebGL which indices to use to index the vertices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer.indices);

        // Tell WebGL to use our program when drawing

        gl.useProgram(programInfo.program);

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
            const vertexCount = (this.positions.length/2);
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        }

    }

};