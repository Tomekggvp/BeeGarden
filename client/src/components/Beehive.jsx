import { assets } from '../assets/assets'

const Beehive = ({ beehiveNum }) => {
  return (
    <div className="hive-token relative mx-auto flex aspect-square w-[96px] items-center justify-center rounded-lg border border-[#f1d88a] bg-[#fff7df] sm:w-[122px] md:w-[136px]">
      <div className="absolute inset-2 rounded-lg border border-dashed border-[#f8b400]/45"></div>

      <img
        src={assets.apiary}
        alt=""
        className="relative z-10 h-[76%] w-[76%] object-contain drop-shadow-[0_8px_12px_rgba(17,24,39,0.16)]"
      />

      <span className="absolute left-3 top-3 z-20 rounded-md bg-[#2f2100] px-2 py-1 text-sm font-black leading-none text-white shadow-sm sm:text-base">
        {beehiveNum}
      </span>
    </div>
  )
}

export default Beehive
