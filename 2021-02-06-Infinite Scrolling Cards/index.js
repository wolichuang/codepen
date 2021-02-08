gsap.registerPlugin(ScrollTrigger) // 注册滚动插件
let iteration = 0
let spacing = 0.1
const size = 9
const cards = gsap.utils.toArray(".cards li")
// 定义参数
let seamLessLoop = initLayout(cards, spacing)
const snap = gsap.utils.snap(spacing)
const scrub = gsap.to(seamLessLoop, {
  totalTime: 0,
  duration: 0.5,
  ease: "power3",
  paused: true
})

// 绘制布局
function initLayout(items, spacing) {
  let overlap = Math.ceil(1 / spacing), // 每一个间隔
    startTime = items.length * spacing + 0.5, // 开始的位置
    loopTime = (items.length + overlap) * spacing + 1, // 每个循环的位置
    rawSequence = gsap.timeline({ paused: true }), // 开启循环
    seamLessLoop = gsap.timeline({
      paused: true,
      repeat: -1, // to accommodate infinite scrolling/looping
      onRepeat() {
        // works around a super rare edge case bug that's fixed GSAP 3.6.1
        this._time === this._dur && (this._tTime += this._dur - 0.01)
      }
    }),
    l = items.length + overlap * 2,
    time = 0,
    i,
    index,
    item

  gsap.set(items, { xPercent: 400, opacity: 0, scale: 0 })

  // 设置每一个位置
  // now loop through and create all the animations in a staggered fashion. Remember, we must create EXTRA animations at the end to accommodate the seamless looping.
  for (i = 0; i < l; i++) {
    index = i % items.length
    item = items[index]
    time = i * spacing
    rawSequence
      .fromTo(
        item,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          zIndex: 100,
          duration: 0.5,
          yoyo: true,
          repeat: 1,
          ease: "power1.in",
          immediateRender: false
        },
        time
      )
      .fromTo(
        item,
        { xPercent: 400 },
        { xPercent: -400, duration: 1, ease: "none", immediateRender: false },
        time
      )
    i <= items.length && seamLessLoop.add("label" + i, time) // we don't really need these, but if you wanted to jump to key spots using labels, here ya go.
  }

  // here's where we set up the scrubbing of the playhead to make it appear seamless.
  rawSequence.time(startTime)
  seamLessLoop
    .to(rawSequence, {
      time: loopTime,
      duration: loopTime - startTime,
      ease: "none"
    })
    .fromTo(
      rawSequence,
      { time: overlap * spacing + 1 },
      {
        time: startTime,
        duration: startTime - (overlap * spacing + 1),
        immediateRender: false,
        ease: "none"
      }
    )
  return seamLessLoop
}

// 绑定滚动事件
const trigger = ScrollTrigger.create({
  start: 0,
  onUpdate(self) {
    if (self.progress === 1 && self.direction > 0 && !self.wrapping) {
      wrapForward(self)
    } else if (self.progress < 1e-5 && self.direction < 0 && !self.wrapping) {
      wrapBackward(self)
    } else {
      scrub.vars.totalTime = snap(
        (iteration + self.progress) * seamLessLoop.duration()
      )
      scrub.invalidate().restart() // to improve performance, we just invalidate and restart the same tween. No need for overwrites or creating a new tween on each update.
      self.wrapping = false
    }
  },
  end: "+=3000",
  pin: ".gallery"
})

// 滚动事件：向前
function wrapForward(trigger) {
  iteration++
  trigger.wrapping = true
  trigger.scroll(trigger.start + 1)
}

// 滚动事件：向后
function wrapBackward(trigger) {
  iteration--
  if (iteration < 0) {
    iteration = size
    seamLessLoop.totalTime(
      seamLessLoop.totalTime() + seamLessLoop.duration() * 10
    )
    scrub.pause() // otherwise it may update the totalTime right before the trigger updates, making the starting value different than what we just set above.
  }
  trigger.wrapping = true
  trigger.scroll(trigger.end - 1)
}

// 绑定 向前 + 向后
function scrubTo(totalTime) {
  // moves the scroll position to the place that corresponds to the totalTime value of the seamlessLoop, and wraps if necessary.
  let progress =
    (totalTime - seamLessLoop.duration() * iteration) / seamLessLoop.duration()
  if (progress > 1) {
    wrapForward(trigger)
  } else if (progress < 0) {
    wrapBackward(trigger)
  } else {
    trigger.scroll(trigger.start + progress * (trigger.end - trigger.start))
  }
}

document
  .querySelector(".next")
  .addEventListener("click", () => scrubTo(scrub.vars.totalTime + spacing))
document
  .querySelector(".prev")
  .addEventListener("click", () => scrubTo(scrub.vars.totalTime - spacing))
