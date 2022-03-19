// The vertical distance between each line equals half the triangle edge length.
// To make hexagons with a vertical central line, the distance between
// points on every horizontal line should be sqrt(3) * the vertical distance
// between each line.
// Additionally, points on alternating lines should be offset by half horizontally.
const defaultTriangleEdgeLength = 30;
const verticalLineSeparation = defaultTriangleEdgeLength / 2;
const horizontalPointSeparation = 1.7320508076 * defaultTriangleEdgeLength;
const randomness = 0.2;

const cursor = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
};

const canvas = document.getElementById("graphicCanvas");
const ctx = canvas.getContext("2d");
ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;

const points = makePoints(window.innerWidth, window.innerHeight);
const triangles = makeTriangles(points);

addEventListener("mousemove", (e) => {
  cursor.x = e.clientX;
  cursor.y = e.clientY;
});

addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
    cursor.x = e.touches[0].clientX;
    cursor.y = e.touches[0].clientY;
  },
  { passive: false }
);

function randomIntFromInterval(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function makePoints(inWidth, inHeight) {
  var points = [];
  for (let row = 0; row <= inHeight / verticalLineSeparation + 4; row++) {
    var rowPoints = [];
    for (let col = 0; col <= inWidth / horizontalPointSeparation + 4; col++) {
      rowPoints.push({
        x:
          (col - 2) * horizontalPointSeparation +
          ((row % 2) * horizontalPointSeparation) / 2 +
          randomIntFromInterval(
            -horizontalPointSeparation * randomness,
            horizontalPointSeparation * randomness
          ),
        y:
          (row - 2) * verticalLineSeparation +
          randomIntFromInterval(
            -verticalLineSeparation * randomness,
            verticalLineSeparation * randomness
          ),
      });
    }
    points.push(rowPoints);
  }
  return points;
}

function randomColor() {
  return `rgb(
        ${randomIntFromInterval(50, 200)},
        ${randomIntFromInterval(50, 200)},
        ${randomIntFromInterval(50, 200)})`;
}

function gaussianFromCursor(point) {
  const sd =
    Math.sqrt(
      Math.pow(window.innerWidth, 2) + Math.pow(window.innerHeight, 2)
    ) / 10;
  const calc = (inp, av) => Math.pow(Math.E, -Math.pow((inp - av) / sd, 2));
  const calc2d = (inp, av) =>
    Math.pow(
      Math.E,
      -1 *
        ((Math.pow(inp.x - av.x, 2) + Math.pow(inp.y - av.y, 2)) /
          Math.pow(sd, 2))
    );
  return {
    x: calc(point.x, cursor.x),
    y: calc(point.y, cursor.y),
    xy2d: calc2d(point, cursor),
  };
}

function getColor(triangle) {
  const redRange = [242, 130];
  const greenRange = [144, 24];
  const blueRange = [131, 5];
  var averageDistance =
    (gaussianFromCursor(triangle.points[0]).xy2d +
      gaussianFromCursor(triangle.points[1]).xy2d +
      gaussianFromCursor(triangle.points[2]).xy2d) /
    3;

  const getColorValue = (distance, [fromVal, toVal]) => {
    return toVal + distance * (fromVal - toVal);
  };

  return `rgb(
        ${getColorValue(averageDistance, redRange)},
        ${getColorValue(averageDistance, greenRange)},
        ${getColorValue(averageDistance, blueRange)})`;
}

function movePoint(point) {
  //   var maxDistance = Math.sqrt(
  //     Math.pow(window.innerWidth, 2) + Math.pow(window.innerHeight, 2)
  //   );
  //   var distance = Math.sqrt(
  //     Math.pow(point.x - cursor.x, 2) + Math.pow(point.y - cursor.y, 2)
  //   );
  //   var horizontalProportion =
  //     Math.abs(point.x - cursor.x) /
  //     (Math.abs(point.y - cursor.y) + Math.abs(point.x - cursor.x));
  const gaussianDistance = gaussianFromCursor(point);
  return {
    x:
      point.x +
      Math.sign(point.x - cursor.x) *
        Math.pow(gaussianDistance.x * gaussianDistance.xy2d, 0.5) *
        defaultTriangleEdgeLength *
        1,
    y:
      point.y +
      Math.sign(point.y - cursor.y) *
        Math.pow(gaussianDistance.y * gaussianDistance.xy2d, 0.5) *
        defaultTriangleEdgeLength *
        1,
  };
}

function moveTrianglePoints(triangle) {
  return {
    ...triangle,
    points: [
      movePoint(triangle.points[0]),
      movePoint(triangle.points[1]),
      movePoint(triangle.points[2]),
    ],
    color: getColor(triangle),
  };
}

function drawTriangle(triangle) {
  ctx.beginPath();
  ctx.moveTo(triangle.points[0].x, triangle.points[0].y);
  ctx.lineTo(triangle.points[1].x, triangle.points[1].y);
  ctx.lineTo(triangle.points[2].x, triangle.points[2].y);
  ctx.closePath();
  ctx.fillStyle = triangle.color;
  ctx.lineWidth = 1;
  ctx.strokeStyle = triangle.color;
  ctx.fill();
  ctx.stroke();
}

function drawTriangles(triangles) {
  //   console.log(gaussianFromCursor(triangles[200].points[0]));
  triangles.forEach((triangle) => {
    drawTriangle(moveTrianglePoints(triangle));
  });
}

function makeTriangles(points) {
  // Take each point as the top left of one triangle and then the top right of another.
  var tempTriangles = [];
  points.forEach((row, rowIndex) => {
    row.forEach((point, colIndex) => {
      if (rowIndex + 2 < points.length) {
        if (colIndex + (rowIndex % 2) < row.length) {
          tempTriangles.push({
            points: [
              point,
              points[rowIndex + 2][colIndex],
              points[rowIndex + 1][colIndex + (rowIndex % 2)],
            ],
            color: randomColor(),
          });
        }
        if (colIndex - ((rowIndex + 1) % 2) >= 0) {
          tempTriangles.push({
            points: [
              point,
              points[rowIndex + 2][colIndex],
              points[rowIndex + 1][colIndex - ((rowIndex + 1) % 2)],
            ],
            color: randomColor(),
          });
        }
      }
    });
  });
  return tempTriangles;
}

function anim() {
  requestAnimationFrame(anim);

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawTriangles(triangles);
}

document.addEventListener("load", anim());
