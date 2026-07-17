import { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'

type Props = {
  size?: number
  strokeWidth?: number
  progress: number // 0-1
  color: string
  trackColor: string
  children?: React.ReactNode
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

export default function ProgressRing({ size = 120, strokeWidth = 12, progress, color, trackColor, children }: Props) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const target = Math.min(Math.max(progress, 0), 1)

  const [animatedProgress, setAnimatedProgress] = useState(0)
  const fromRef = useRef(0)

  useEffect(() => {
    const from = fromRef.current
    const duration = 900
    const start = Date.now()
    let frame: ReturnType<typeof requestAnimationFrame>

    function tick() {
      const t = Math.min((Date.now() - start) / duration, 1)
      setAnimatedProgress(from + (target - from) * easeOutCubic(t))
      if (t < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target])

  const strokeDashoffset = circumference * (1 - animatedProgress)

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      {children}
    </View>
  )
}
