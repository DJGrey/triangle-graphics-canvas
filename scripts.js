// The vertical distance between each line equals half the triangle edge length.
// To make hexagons with a vertical central line, the distance between
// points on every horizontal line should be sqrt(3) * the vertical distance
// between each line.
// Additionally, points on alternating lines should be offset by half horizontally.
const defaultTriangleEdgeLength = 30;
const verticalLineSeparation = defaultTriangleEdgeLength / 2;
const horizontalPointSeparation = 1.7320508076 * defaultTriangleEdgeLength;
const randomness = 0.2;

const availableColorRanges = [
  {
    from: {
      red: 242,
      green: 144,
      blue: 131,
    },
    to: {
      red: 130,
      green: 24,
      blue: 5,
    },
  },
  {
    from: {
      red: 242,
      green: 211,
      blue: 70,
    },
    to: {
      red: 121,
      green: 114,
      blue: 207,
    },
  },
];

const colorRange =
  availableColorRanges[Math.floor(Math.random() * availableColorRanges.length)];

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

function randomTint() {
  const brightness = randomIntFromInterval(-3, 3);
  return {
    red: brightness,
    green: brightness,
    blue: brightness,
  };
  // return {
  //   red: randomIntFromInterval(-5, 5),
  //   green: randomIntFromInterval(-5, 5),
  //   blue: randomIntFromInterval(-5, 5),
  // };
}

// Return angle in radians where 0 is horizontal right and PI/2 is vertical down.
function angleFromCursor(point) {
  return Math.atan((point.y - cursor.y) / (point.x - cursor.x));
}

function gaussianFromCursor(point) {
  const sd =
    Math.sqrt(
      Math.pow(window.innerWidth, 2) + Math.pow(window.innerHeight, 2)
    ) / 10;

  return Math.pow(
    Math.E,
    -1 *
      ((Math.pow(point.x - cursor.x, 2) + Math.pow(point.y - cursor.y, 2)) /
        Math.pow(sd, 2))
  );
}

function clampInt(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function getColor(triangle) {
  var averageDistance =
    (gaussianFromCursor(triangle.points[0]) +
      gaussianFromCursor(triangle.points[1]) +
      gaussianFromCursor(triangle.points[2])) /
    3;

  const getColorValue = (distance, [fromVal, toVal]) => {
    return toVal + distance * (fromVal - toVal);
  };

  return `rgb(
        ${clampInt(
          getColorValue(averageDistance, [
            colorRange.from.red,
            colorRange.to.red,
          ]) + triangle.tint.red,
          0,
          255
        )},
        ${clampInt(
          getColorValue(averageDistance, [
            colorRange.from.green,
            colorRange.to.green,
          ]) + triangle.tint.green,
          0,
          255
        )},
        ${clampInt(
          getColorValue(averageDistance, [
            colorRange.from.blue,
            colorRange.to.blue,
          ]) + triangle.tint.blue,
          0,
          255
        )})`;
}

function movePoint(point) {
  const gaussianDistance = gaussianFromCursor(point);
  const angle = Math.abs(angleFromCursor(point));
  return {
    // X proportion is minimum at angle=PI/2 and 3PI/2.
    // X proportion is maximum at angle=0 and PI
    x:
      point.x +
      Math.sign(point.x - cursor.x) *
        gaussianDistance *
        Math.abs((angle % Math.PI) - Math.PI / 2) *
        defaultTriangleEdgeLength,
    // Y proportion is minimum at angle=0 and PI
    // Y proportion is maximum at angle=PI/2 and 3PI/2.
    y:
      point.y +
      Math.sign(point.y - cursor.y) *
        gaussianDistance *
        (Math.PI / 2 - Math.abs((angle % Math.PI) - Math.PI / 2)) *
        defaultTriangleEdgeLength,
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
            color: "black",
            tint: randomTint(),
          });
        }
        if (colIndex - ((rowIndex + 1) % 2) >= 0) {
          tempTriangles.push({
            points: [
              point,
              points[rowIndex + 2][colIndex],
              points[rowIndex + 1][colIndex - ((rowIndex + 1) % 2)],
            ],
            color: "black",
            tint: randomTint(),
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
