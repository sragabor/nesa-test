'use client'
import Token, { useTimeline } from './Nesa/Token'

var scrollSize = 6

export default function Home() {
  const timeline = useTimeline()

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    var rect = e.currentTarget.getBoundingClientRect()

    timeline.setMousePosition(
      ((e.clientX - rect.x) / e.currentTarget.clientWidth) * 2.0 - 1.0,
      -(((e.clientY - rect.y) / e.currentTarget.clientHeight) * 2.0 - 1.0)
    )
  }

  const onScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    var rect = e.currentTarget.getBoundingClientRect()
    let scroll = Math.max(
      0.0,
      Math.min(1.0, e.currentTarget.scrollTop / (rect.height * (scrollSize - 1)))
    )
    //tokenEvents.setScroll(scroll)
    timeline.setTime(scroll)
    e.preventDefault()
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <div
          style={{
            background: 'black',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center'
          }}
        >
          <Token></Token>
          <div
            className="controller"
            style={{
              overflow: 'scroll',
              position: 'absolute',
              width: '100%',
              background: 'transparent',
              height: '100%'
            }}
            onMouseMove={onMouseMove}
            onScroll={onScroll}
          >
            <div style={{ width: '100%', height: `${scrollSize * 100}%` }}></div>
          </div>
        </div>
      </div>
    </main>
  )
}
