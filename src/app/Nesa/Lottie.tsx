'use client'

import * as React from 'react'
import { AlignedView, useTimeline } from './Token'

import { Player } from '@lottiefiles/react-lottie-player'

export interface LottieState {
  json: string
  name: string
  scale: number
}

const Lottie = React.memo(({ json, name, scale }: LottieState) => {
  const size = 50 * scale

  const ref = React.useRef<Player | null>(null)

  const { time } = useTimeline((state) => state)

  React.useEffect(() => {
    if (ref.current?.state.animationData != null) {
      var fr = Math.min(time, ref.current?.state.animationData.op)
      ref.current?.setSeeker(fr)
    }
  }, [time])

  return (
    <AlignedView align="center" elementName={name}>
      <Player
        autoplay={false}
        loop={false}
        src={json}
        ref={ref}
        style={{
          position: 'relative',
          top: `-${size * 0.5}`,
          left: `-${size * 0.5}`,
          height: `${size}px`,
          width: `${size}px`
        }}
      ></Player>
    </AlignedView>
  )
})

Lottie.displayName = 'Lottie'

export default Lottie
