const svg = document.querySelector("svg")
const curve = document.getElementById("curve")
const controlPoint = document.getElementById("control-point")
const posXLabel = document.querySelector(".posX")
const posYLabel = document.querySelector(".posY")
const svgViewBoxWidth = 190

let isMouseDown = false
let point = {
  x: 95,
  y: 80
}

function updateCurve(x, y) {
  let svgRect = svg.getBoundingClientRect() // 获取位置
  let scale = svgRect.width / svgViewBoxWidth
  let width = svgRect.width / scale - 5
  let height = svgRect.height / scale - 6

  if (x && y) {
    point.x = Math.ceil((x - svgRect.x) / scale)
    point.y = Math.ceil((y - svgRect.y) / scale)
  }

  point.x = point.x < 5 ? 5 : point.x
  point.y = point.y < 5 ? 5 : point.y
  point.x = point.x > width ? Math.ceil(width) : point.x
  point.y = point.y > height ? Math.ceil(height) : point.y

  posXLabel.textContent = point.x.toFixed(2)
  posYLabel.textContent = point.y.toFixed(2)

  controlPoint.setAttribute("cx", point.x)
  controlPoint.setAttribute("cy", point.y)

  curve.setAttribute(
    "d",
    curve
      .getAttribute("d")
      .replace(/Q (\d+(\.\d+)?) (\d+(\.\d+)?)/, `Q ${point.x} ${point.y}`)
  )
}

function onMouseDown() {
  isMouseDown = true
}

function onMouseMove(ev) {
  if (isMouseDown) {
    updateCurve(ev.clientX, ev.clientY)
  }
}

function onMouseUp() {
  isMouseDown = false

  anime({
    targets: point,
    x: 95,
    y: 80,
    duration: 1000,
    easing: "easeOutElastic(1.5, 0.2)",
    update: function () {
      updateCurve()
    }
  })
}
controlPoint.addEventListener("mousedown", onMouseDown)
controlPoint.addEventListener("touchstart", onMouseDown)

document.addEventListener("mousemove", onMouseMove)
document.addEventListener("touchmove", (ev) => {
  updateCurve(ev.touches[0].clientX, ev.touches[0].clientY)
})

document.addEventListener("mouseup", onMouseUp)
document.addEventListener("touchend", onMouseUp)
