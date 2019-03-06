main();

var ply, track1, track2;
var gameOver = false;
var downPressed = false;
var rightPressed = false;
var leftPressed = false;
var spacePressed = false;
var coins, score = 0, hurdle1s, hurdle2s;

document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);

function main() {

  const canvas = document.querySelector('#glcanvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  ply = new Player(gl, [-3, 0, -0]);
  track1 = new Track(gl, [-3, -1, 0]);
  track2 = new Track(gl, [3, -1, 0]);
  coins = [];
  for (var i=0; i<500; ++i) {
    let tmp = Math.floor(Math.random()*99+1);
    tmp %= 2;
    if (tmp) tmp = track1.pos[0];
    else tmp = track2.pos[0];
    coins.push(new Coin(gl, [tmp, 0.5, -Math.floor(Math.random()*9999+1)]));
  }
  hurdle1s = [];
  for (var i=0; i<50; ++i) {
    let tmp = Math.floor(Math.random()*99+1);
    tmp %= 2;
    if (tmp) tmp = track1.pos[0];
    else tmp = track2.pos[0];
    hurdle1s.push(new Hurdle1(gl, [tmp, 0, -Math.floor(Math.random()*9999+1)]));
  }
  hurdle2s = [];
  for (var i=0; i<50; ++i) {
    let tmp = Math.floor(Math.random()*99+1);
    tmp %= 2;
    if (tmp) tmp = track1.pos[0];
    else tmp = track2.pos[0];
    hurdle2s.push(new Hurdle2(gl, [tmp, 0, -Math.floor(Math.random()*9999+1)]));
  }

  // If we don't have a GL context, give up now
  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }

  // Vertex shader program
  const vsSource = `
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
  const fsSource = `
    varying lowp vec4 vColor;

    void main(void) {
      gl_FragColor = vColor;
    }
  `;

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aVevrtexColor and also
  // look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
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

    drawScene(gl, programInfo, deltaTime);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}


function drawScene(gl, programInfo, deltaTime) {
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
  const zFar = 110000;
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

    var eye = [0, ply.pos[1]+4, ply.pos[2]+14];
    if (eye[1] < 4) eye[1] = 4;
    var up = [0, 1, 0];
    var target = [0, ply.pos[1], ply.pos[2]];
    if (target[1] < 0) target[1] = 0;
    
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
    ply.draw(gl, viewProjectionMatrix, programInfo, deltaTime);
    track1.draw(gl, viewProjectionMatrix, programInfo, deltaTime);
    track2.draw(gl, viewProjectionMatrix, programInfo, deltaTime);
    for (var i=0; i<coins.length; ++i) {
      coins[i].draw(gl, viewProjectionMatrix, programInfo, deltaTime);
    }
    for (var i=0; i<hurdle1s.length; ++i) {
      hurdle1s[i].draw(gl, viewProjectionMatrix, programInfo, deltaTime);
    }
    for (var i=0; i<hurdle2s.length; ++i) {
      hurdle2s[i].draw(gl, viewProjectionMatrix, programInfo, deltaTime);
    }
    tick_input();
    tick_elements();
    detect_collisions();
}

function tick_input () {
  if (spacePressed && ply.pos[1] == 0) {
    ply.speed[1] = 0.3;
  }
  else if (!spacePressed && ply.pos[1] == 0) {
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
    ply.pos[1] = -1;
  }
  else if (ply.pos[1] < 0) {
    ply.pos[1] = 0;
    ply.speed[1] = 0;
  }
}

function tick_elements () {
  ply.tick();
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
  for (var i=0; i<coins.length; ++i) {
    let x, y, z;
    x = y = z = false;
    if (coins[i].pos[0] >= ply.pos[0] - 1 && coins[i].pos[0] <= ply.pos[0] + 1) x = true;
    if (coins[i].pos[1] >= ply.pos[1] - 1 && coins[i].pos[1] <= ply.pos[1] + 1) y = true;
    if (coins[i].pos[2] >= ply.pos[2] - 1 && coins[i].pos[2] <= ply.pos[2] + 1) z = true;
    if (x && y && z) {
      score += 1;
      // console.log("collided");
    }
  }

  // with hurdle 1
  for (var i=0; i<hurdle1s.length; ++i) {
    let x, y, z;
    x = y = z = false;
    if (Math.abs(ply.pos[0] - hurdle1s[i].pos[0]) <= 0.05) x = true;
    if (ply.pos[2] - 1 <= hurdle1s[i].pos[2] && ply.pos[2] + 1 >= hurdle1s[i].pos[2]) z = true;
    let yy = hurdle1s[i].pos[1] + 2;
    if (ply.pos[1] - 0.5 <= yy) y = true;
    if (x && y && z) {
      gameOver = true;
      console.log("mar gaya hai...ye bhoot hai");
    }
  }

  // with hurdle 2
  for (var i=0; i<hurdle2s.length; ++i) {
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
      console.log("gaya...");
    }
  }

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
