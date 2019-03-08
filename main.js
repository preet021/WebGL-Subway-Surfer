main();

var ply, track1, track2, ground, bootick;
var gameOver = false;
var downPressed = false;
var rightPressed = false;
var leftPressed = false;
var spacePressed = false;
var coins, score = 0, hurdle1s, hurdle2s, fboosts, coins1, boots, spdbrks, police;

document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);

function main() {

  const canvas = document.querySelector('#glcanvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.BLEND);
  const hurdle1texture = loadTexture(gl, 'wooden.jpg');

  ply = new Player(gl, [-3, 1, 0]);
  
  track1 = new Track(gl, [-3, 0, 0]);
  track2 = new Track(gl, [3, 0, 0]);

  wall1 = new Wall(gl, [-7, 0, 0]);
  wall2 = new Wall(gl, [7, 0, 0]);

  ground = new Ground(gl, [0, -0.2, 0]);

  police = new Police(gl, [-3, 1, 5]);
  
  coins = [];
  for (var i=0; i<500; ++i) {
    let tmp = Math.floor(Math.random()*99+1);
    tmp %= 2;
    if (tmp) tmp = track1.pos[0];
    else tmp = track2.pos[0];
    coins.push(new Coin(gl, [tmp, 0.5, -Math.floor(Math.random()*99999+1)]));
  }

  coins1 = [];
  for (var i=0; i<80; ++i) {
    let tmp = Math.floor(Math.random()*99+1);
    tmp %= 2;
    if (tmp) tmp = track1.pos[0];
    else tmp = track2.pos[0];
    coins1.push(new Coin(gl, [tmp, 0.5, -Math.floor(Math.random()*99999+1)]));
  }

  hurdle1s = [];
  for (var i=0; i<0; ++i) {
    let tmp = Math.floor(Math.random()*99+1);
    tmp %= 2;
    if (tmp) tmp = track1.pos[0];
    else tmp = track2.pos[0];
    hurdle1s.push(new Hurdle1(gl, [tmp, 0, -Math.floor(Math.random()*99999+1)], hurdle1texture));
  }
  
  hurdle2s = [];
  for (var i=0; i<50; ++i) {
    let tmp = Math.floor(Math.random()*99+1);
    tmp %= 2;
    if (tmp) tmp = track1.pos[0];
    else tmp = track2.pos[0];
    hurdle2s.push(new Hurdle2(gl, [tmp, 0, -Math.floor(Math.random()*99999+1)]));
  }

  fboosts = [];
  for (var i=0; i<100; ++i) {
  	let tmp = Math.floor(Math.random()*99+1);
    tmp %= 2;
    if (tmp) tmp = track1.pos[0];
    else tmp = track2.pos[0];
    fboosts.push(new Flyboost(gl, [tmp, 0.5, -Math.floor(Math.random()*99999+1)]));
  }

  boots = [];
  for (var i=0; i<100; ++i) {
  	let tmp = Math.floor(Math.random()*99+1);
    tmp %= 2;
    if (tmp) tmp = track1.pos[0];
    else tmp = track2.pos[0];
    boots.push(new Boot(gl, [tmp, 0.5, -Math.floor(Math.random()*99999+1)]));
  }

  spdbrks = [];
  for (var i=0; i<100; ++i) {
  	let tmp = Math.floor(Math.random()*99+1);
    tmp %= 2;
    if (tmp) tmp = track1.pos[0];
    else tmp = track2.pos[0];
    spdbrks.push(new Brake(gl, [tmp, 0, -Math.floor(Math.random()*99999+1)]));
  }

  // If we don't have a GL context, give up now
  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }

  // Vertex shader program
  const vsSource1 = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
    }
  `;

  // Fragment shader program
  const fsSource1 = `
    varying lowp vec4 vColor;

    void main(void) {
      gl_FragColor = vColor;
    }
  `;

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram1 = initShaderProgram(gl, vsSource1, fsSource1);

  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aVevrtexColor and also
  // look up uniform locations.
  const programInfo1 = {
    program: shaderProgram1,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram1, 'aVertexPosition'),
      vertexColor: gl.getAttribLocation(shaderProgram1, 'aVertexColor'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram1, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram1, 'uModelViewMatrix'),
    },
  };

  const vsSource2 = `
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoord;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying highp vec2 vTextureCoord;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;
    }
  `;

  const fsSource2 = `
    varying highp vec2 vTextureCoord;

    uniform sampler2D uSampler;

    void main(void) {
      gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
  `;

  const shaderProgram2 = initShaderProgram(gl, vsSource2, fsSource2);

  const programInfo2 = {
    program: shaderProgram2,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram2, 'aVertexPosition'),
      textureCoord: gl.getAttribLocation(shaderProgram2, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram2, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram2, 'uModelViewMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram2, 'uSampler'),
    },
  };

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  //const buffers

  var then = 0;

  // Draw the scene repeatedly
  function render(now) {
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;

    drawScene(gl, programInfo1, programInfo2, deltaTime);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

function drawScene(gl, programInfo1, programInfo2, deltaTime) {
  gl.clearColor(1, 1, 1, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 11000;
  const projectionMatrix = mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.perspective(projectionMatrix,
                   fieldOfView,
                   aspect,
                   zNear,
                   zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
    var cameraMatrix = mat4.create();

    var eye = [0, ply.pos[1]+8, ply.pos[2]+18];
    if (eye[1] < 9) eye[1] = 9;
    var up = [0, 1, 0];
    var target = [0, ply.pos[1], ply.pos[2]];
    if (target[1] < 1) target[1] = 1;
    
    mat4.translate(cameraMatrix, cameraMatrix, eye);
    var cameraPosition = [
      cameraMatrix[12],
      cameraMatrix[13],
      cameraMatrix[14],
    ];

    mat4.lookAt(cameraMatrix, cameraPosition, target, up);

    var viewMatrix = cameraMatrix;//mat4.create();

    //mat4.invert(viewMatrix, cameraMatrix);

    var viewProjectionMatrix = mat4.create();

    mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);

    // draw elements
    ply.draw(gl, viewProjectionMatrix, programInfo1, deltaTime);
    ground.draw(gl, viewProjectionMatrix, programInfo2, deltaTime);
    track1.draw(gl, viewProjectionMatrix, programInfo2, deltaTime);
    track2.draw(gl, viewProjectionMatrix, programInfo2, deltaTime);
    wall1.draw(gl, viewProjectionMatrix, programInfo2, deltaTime);
    wall2.draw(gl, viewProjectionMatrix, programInfo2, deltaTime);
    for (var i=0; i<coins.length; ++i) {
      coins[i].draw(gl, viewProjectionMatrix, programInfo2, deltaTime);
    }
    for (var i=0; i<coins1.length && ply.hasFlyBoost; ++i) {
      coins1[i].draw(gl, viewProjectionMatrix, programInfo2, deltaTime);
    }
    for (var i=0; i<hurdle1s.length; ++i) {
      hurdle1s[i].draw(gl, viewProjectionMatrix, programInfo1, deltaTime);
    }
    for (var i=0; i<hurdle2s.length; ++i) {
      hurdle2s[i].draw(gl, viewProjectionMatrix, programInfo1, deltaTime);
    }
    for (var i=0; i<fboosts.length; ++i) {
      fboosts[i].draw(gl, viewProjectionMatrix, programInfo1, deltaTime);
    }
    for (var i=0; i<boots.length; ++i) {
      boots[i].draw(gl, viewProjectionMatrix, programInfo1, deltaTime);
    }
    for (var i=0; i<spdbrks.length; ++i) {
      spdbrks[i].draw(gl, viewProjectionMatrix, programInfo2, deltaTime);
    }
    police.draw(gl, viewProjectionMatrix, programInfo1, deltaTime);
    tick_input();
    tick_elements();
    detect_collisions();
}

function tick_input () {
  if (spacePressed && ply.pos[1] == 1 && ply.hasFlyBoost == false) {
    if (ply.hasBoot == true) ply.speed[1] = ply.lrgjmpspd;
    else ply.speed[1] = ply.smljmpspd;
  }
  else if (!spacePressed && ply.pos[1] == 1 && ply.hasFlyBoost == false) {
    ply.speed[1] = 0;
  }
  if (leftPressed && ply.pos[0] > track1.pos[0]) {
    ply.speed[0] = -0.4;
  }
  if (leftPressed && ply.pos[0] == track1.pos[0]) {
    // call police
  }
  if (rightPressed && ply.pos[0] < track2.pos[0]) {
    ply.speed[0] = 0.4;
  }
  if (rightPressed && ply.pos[0] == track2.pos[0]) {
    // call police
  }
  if (downPressed) {
    ply.pos[1] = 0;
  }
  else if (ply.pos[1] < 1) {
    ply.pos[1] = 1;
    ply.speed[1] = 0;
  }
}

function tick_elements () {
  ply.tick();
  police.tick();
  police.pos[1] = ply.pos[1];
  police.pos[0] = ply.pos[0];
  if (Math.abs(ply.pos[0] - track1.pos[0]) <= 0.01 && ply.speed[0] < 0) {
    ply.speed[0] = 0;
    ply.pos[0] = -3;
  }
  if (Math.abs(ply.pos[0] - track2.pos[0]) <= 0.01 && ply.speed[0] > 0) {
    ply.speed[0] = 0;
    ply.pos[0] = 3;
  }
}

function detect_collisions () {

  // with coins
  for (var i=0; i<coins.length && ply.hasFlyBoost == false; ++i) {
    let x, y, z;
    x = y = z = false;
    if (coins[i].pos[0] >= ply.pos[0] - 1 && coins[i].pos[0] <= ply.pos[0] + 1) x = true;
    if (coins[i].pos[1] >= ply.pos[1] - 1 && coins[i].pos[1] <= ply.pos[1] + 1) y = true;
    if (coins[i].pos[2] >= ply.pos[2] - 1 && coins[i].pos[2] <= ply.pos[2] + 1) z = true;
    if (x && y && z) {
      score += 1;
      coins[i].pos[2] = 1000;
      // console.log("collided");
    }
  }

  for (var i=0; i<coins1.length && ply.hasFlyBoost; ++i) {
    let x, y, z;
    x = y = z = false;
    if (coins1[i].pos[0] >= ply.pos[0] - 1 && coins1[i].pos[0] <= ply.pos[0] + 1) x = true;
    if (coins1[i].pos[1] >= ply.pos[1] - 1 && coins1[i].pos[1] <= ply.pos[1] + 1) y = true;
    if (coins1[i].pos[2] >= ply.pos[2] - 1 && coins1[i].pos[2] <= ply.pos[2] + 1) z = true;
    if (x && y && z) {
      score += 1;
      coins1[i].pos[2] = 1000;
    }
  }

  // with hurdle 1
  for (var i=0; i<hurdle1s.length && ply.hasFlyBoost == false; ++i) {
    let x, y, z;
    x = y = z = false;
    if (Math.abs(ply.pos[0] - hurdle1s[i].pos[0]) <= 0.05) x = true;
    if (ply.pos[2] - 1 <= hurdle1s[i].pos[2] && ply.pos[2] + 1 >= hurdle1s[i].pos[2]) z = true;
    let yy = hurdle1s[i].pos[1] + 2;
    if (ply.pos[1] - 0.5 <= yy) y = true;
    if (x && y && z) {
      gameOver = true;
      // console.log("mar gaya hai...ye bhoot hai");
    }
  }

  // with hurdle 2
  for (var i=0; i<hurdle2s.length && ply.hasFlyBoost == false; ++i) {
    let x, y, z, a, b, c, d;
    x = y = z = false;
    if (Math.abs(ply.pos[0] - hurdle2s[i].pos[0]) <= 0.05) x = true;
    if (ply.pos[2] - 1 <= hurdle2s[i].pos[2] && ply.pos[2] + 1 >= hurdle2s[i].pos[2]) z = true;
    a = ply.pos[1] - 1;
    b = ply.pos[1] + 1;
    c = hurdle2s[i].pos[1] + 1;
    d = hurdle2s[i].pos[1] + 3;
    if (!(b < c || d < a)) y = true;
    if (x && y && z) {
      gameOver = true;
      // console.log("gaya...");
    }
  }

  // with flying boost
  for (var i=0; i<fboosts.length && ply.hasFlyBoost == false; ++i) {
  	let x, y, z;
  	x = y = z = false;
  	if (Math.abs(ply.pos[0] - fboosts[i].pos[0]) <= 0.05) x = true;
  	if (Math.abs(ply.pos[1] - fboosts[i].pos[1]) <= 1.3) y = true;
  	if (Math.abs(ply.pos[2] - fboosts[i].pos[2]) <= 1.3) z = true;
  	if (x && y && z) {
  		fboosts[i].pos[2] = 1000;
  		for (var j=0; j<coins1.length; ++j) {
  			if (j % 10 < 5) coins1[j].pos[0] = track1.pos[0];
  			else coins1[j].pos[0] = track2.pos[0];
  			coins1[j].pos[1] = ply.maxheight;
  			coins1[j].pos[2] = ply.pos[2] + 10*ply.maxheight*ply.speed[2] - 3*j;
  		}
  		ply.speed[1] = 0.1;
  		ply.hasFlyBoost = true;
  		setTimeout(function(){
  			ply.speed[1] = -ply.lrgjmpspd;
  			ply.hasFlyBoost = false;
  		}, 12*1000);
  	}

  	// with speed brakers
  	for (var i=0; i<spdbrks.length && ply.hasFlyBoost == false; ++i) {
  		let x, y, z;
  		x = y = z = false;
  		if (ply.pos[1] == 1) y = true;
  		if (Math.abs(ply.pos[0]-spdbrks[i].pos[0]) <= 0.01) x = true;
  		if (Math.abs(ply.pos[2]-spdbrks[i].pos[2]) <= 0.5+spdbrks[i].l/2.0) z = true;
  		if (x && y && z) {
  			spdbrks[i].pos[2] = 1000;
  			police.pos[0] = ply.pos[0];
  			police.pos[2] = ply.pos[2] + 5;
  			ply.speed[2] = -0.2;
  		}
  	}
  }

  // with jumping boot
  for (var i=0; i<boots.length && ply.hasFlyBoost == false; ++i) {
  	let x, y, z;
  	x = y = z = false;
  	if (Math.abs(ply.pos[0] - boots[i].pos[0]) <= 0.05) x = true;
  	if (Math.abs(ply.pos[1] - boots[i].pos[1]) <= 1.3) y = true;
  	if (Math.abs(ply.pos[2] - boots[i].pos[2]) <= 1.3) z = true;
  	if (x && y && z) {
  		console.log("gotboot");
  		bootick = 0;
  		boots[i].pos[2] = 1000;
  		ply.hasBoot = true;
  	}
  }
  if (ply.hasBoot && bootick > 800) {
  	ply.hasBoot = false;
  	console.log("gone");
  }
  else bootick += 1;

}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function keyDownHandler(event) {
    if(event.keyCode == 39) {
        rightPressed = true;
    }
    if(event.keyCode == 37) {
        leftPressed = true;
    }
    if(event.keyCode == 40) {
      downPressed = true;
    }
    if(event.keyCode == 32) {
        spacePressed = true;
    }
}

function keyUpHandler(event) {
    if(event.keyCode == 39) {
        rightPressed = false;
    }
    if(event.keyCode == 37) {
        leftPressed = false;
    }
    if(event.keyCode == 40) {
        downPressed = false;
    }
    if(event.keyCode == 32) {
        spacePressed = false;
    }
}

//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be download over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
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
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // Yes, it's a power of 2. Generate mips.
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       // No, it's not a power of 2. Turn off mips and set
       // wrapping to clamp to edge
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.crossOrigin = "anonymous";
  image.src = url;
  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}
