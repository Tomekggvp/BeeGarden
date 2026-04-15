import { assets } from '../assets/assets'

const Beehive = ({ beehiveNum }) => {
  return (
    <div className="hive-token relative mx-auto flex aspect-square w-[78px] items-center justify-center sm:w-[122px] md:w-[136px]">
      <img
        src={assets.apiary}
        alt=""
        className="relative z-10 h-[82%] w-[82%] object-contain drop-shadow-[0_8px_12px_rgba(17,24,39,0.18)]"
      />

      <span className="absolute left-1/2 top-[46%] z-20 -translate-x-1/2 -translate-y-1/2 rounded bg-[#2f2100] px-1.5 py-0.5 text-[10px] font-black leading-none text-white shadow-sm sm:rounded-md sm:px-2 sm:py-1 sm:text-base">
        {beehiveNum}
      </span>
    </div>
  )
}

export default Beehive
