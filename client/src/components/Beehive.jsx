import { Cross, Droplets, Hexagon } from 'lucide-react'
import { assets } from '../assets/assets'

const badgeClassName = 'flex h-6 w-6 items-center justify-center sm:h-9 sm:w-9'

const HiveBadge = ({ kind, title }) => {
  if (kind === 'pumping') {
    return (
      <span className={badgeClassName} title={title}>
        <span className="relative block h-full w-full">
          <Hexagon
            className="h-full w-full text-[#e09b00]"
            fill="#ffd24a"
            strokeWidth={1.75}
          />
          <Droplets
            size={14}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#8b4f00] sm:h-5 sm:w-5"
          />
        </span>
      </span>
    )
  }

  return (
    <span
      className={`${badgeClassName} rounded-[7px] border border-[#bfe2c7] bg-[#2f9e44] text-white shadow-sm`}
      title={title}
    >
      <Cross size={14} strokeWidth={3} className="sm:h-5 sm:w-5" />
    </span>
  )
}

const Beehive = ({ beehiveNum, badges = [] }) => (
  <div className="hive-token relative mx-auto flex aspect-square w-[78px] items-center justify-center sm:w-[122px] md:w-[136px]">
    <img
      src={assets.apiary}
      alt=""
      className="relative z-10 h-[82%] w-[82%] object-contain drop-shadow-[0_8px_12px_rgba(17,24,39,0.18)]"
    />

    {badges.length > 0 && (
      <div className="absolute right-[8%] top-[10%] z-30 flex flex-col gap-1">
        {badges.map((badge) => (
          <HiveBadge
            key={`${badge.kind}-${badge.title}`}
            kind={badge.kind}
            title={badge.title}
          />
        ))}
      </div>
    )}

    <span className="absolute left-1/2 top-[46%] z-20 -translate-x-1/2 -translate-y-1/2 rounded bg-[#2f2100] px-1.5 py-0.5 text-[10px] font-black leading-none text-white shadow-sm sm:rounded-md sm:px-2 sm:py-1 sm:text-base">
      {beehiveNum}
    </span>
  </div>
)

export default Beehive
