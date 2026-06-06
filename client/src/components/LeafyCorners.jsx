import { Leaf } from 'lucide-react'

const leafFrames = [
  {
    cornerClass: 'left-0 top-0 origin-top-left',
    leaves: [
      { className: 'left-0 top-0 h-8 w-8 -rotate-[48deg] sm:h-10 sm:w-10', delay: '0ms', color: '#1f8f35' },
      { className: 'left-8 top-1 h-7 w-7 -rotate-[20deg] sm:h-8 sm:w-8', delay: '120ms', color: '#63b22f' },
      { className: 'left-1 top-8 h-8 w-8 -rotate-[74deg] sm:h-9 sm:w-9', delay: '260ms', color: '#126d2d' },
      { className: 'left-16 top-0 h-6 w-6 rotate-[18deg] sm:h-7 sm:w-7', delay: '180ms', color: '#92c83e' },
      { className: 'left-9 top-11 h-7 w-7 -rotate-[36deg] sm:h-8 sm:w-8', delay: '340ms', color: '#4fa02f' },
      { className: 'left-0 top-17 h-6 w-6 -rotate-[96deg] sm:h-7 sm:w-7', delay: '80ms', color: '#79bf31' },
      { className: 'left-[5.5rem] top-3 h-5 w-5 rotate-[38deg] sm:h-6 sm:w-6', delay: '420ms', color: '#2b8d30' },
    ],
  },
  {
    cornerClass: 'right-0 top-0 origin-top-right',
    leaves: [
      { className: 'right-0 top-0 h-8 w-8 rotate-[48deg] sm:h-10 sm:w-10', delay: '80ms', color: '#1f8f35' },
      { className: 'right-8 top-1 h-7 w-7 rotate-[20deg] sm:h-8 sm:w-8', delay: '220ms', color: '#63b22f' },
      { className: 'right-1 top-8 h-8 w-8 rotate-[74deg] sm:h-9 sm:w-9', delay: '40ms', color: '#126d2d' },
      { className: 'right-16 top-0 h-6 w-6 -rotate-[18deg] sm:h-7 sm:w-7', delay: '300ms', color: '#92c83e' },
      { className: 'right-9 top-11 h-7 w-7 rotate-[36deg] sm:h-8 sm:w-8', delay: '160ms', color: '#4fa02f' },
      { className: 'right-0 top-17 h-6 w-6 rotate-[96deg] sm:h-7 sm:w-7', delay: '380ms', color: '#79bf31' },
      { className: 'right-[5.5rem] top-3 h-5 w-5 -rotate-[38deg] sm:h-6 sm:w-6', delay: '20ms', color: '#2b8d30' },
    ],
  },
  {
    cornerClass: 'bottom-0 left-0 origin-bottom-left',
    leaves: [
      { className: 'bottom-0 left-0 h-8 w-8 rotate-[48deg] sm:h-10 sm:w-10', delay: '120ms', color: '#1d8733' },
      { className: 'bottom-1 left-8 h-7 w-7 rotate-[20deg] sm:h-8 sm:w-8', delay: '20ms', color: '#63b22f' },
      { className: 'bottom-8 left-1 h-8 w-8 rotate-[74deg] sm:h-9 sm:w-9', delay: '280ms', color: '#126d2d' },
      { className: 'bottom-0 left-16 h-6 w-6 -rotate-[18deg] sm:h-7 sm:w-7', delay: '180ms', color: '#92c83e' },
      { className: 'bottom-11 left-9 h-7 w-7 rotate-[36deg] sm:h-8 sm:w-8', delay: '360ms', color: '#4fa02f' },
      { className: 'bottom-[4.25rem] left-0 h-6 w-6 rotate-[96deg] sm:h-7 sm:w-7', delay: '90ms', color: '#79bf31' },
      { className: 'bottom-3 left-[5.5rem] h-5 w-5 -rotate-[38deg] sm:h-6 sm:w-6', delay: '420ms', color: '#2b8d30' },
    ],
  },
  {
    cornerClass: 'bottom-0 right-0 origin-bottom-right',
    leaves: [
      { className: 'bottom-0 right-0 h-8 w-8 -rotate-[48deg] sm:h-10 sm:w-10', delay: '200ms', color: '#1d8733' },
      { className: 'bottom-1 right-8 h-7 w-7 -rotate-[20deg] sm:h-8 sm:w-8', delay: '70ms', color: '#63b22f' },
      { className: 'bottom-8 right-1 h-8 w-8 -rotate-[74deg] sm:h-9 sm:w-9', delay: '310ms', color: '#126d2d' },
      { className: 'bottom-0 right-16 h-6 w-6 rotate-[18deg] sm:h-7 sm:w-7', delay: '150ms', color: '#92c83e' },
      { className: 'bottom-11 right-9 h-7 w-7 -rotate-[36deg] sm:h-8 sm:w-8', delay: '340ms', color: '#4fa02f' },
      { className: 'bottom-[4.25rem] right-0 h-6 w-6 -rotate-[96deg] sm:h-7 sm:w-7', delay: '40ms', color: '#79bf31' },
      { className: 'bottom-3 right-[5.5rem] h-5 w-5 rotate-[38deg] sm:h-6 sm:w-6', delay: '430ms', color: '#2b8d30' },
    ],
  },
]

const LeafyCorners = () => (
  <div className="leaf-corners pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
    {leafFrames.map((corner) => (
      <div key={corner.cornerClass} className={`absolute h-28 w-32 sm:h-36 sm:w-44 lg:scale-125 xl:scale-[1.35] ${corner.cornerClass}`}>
        {corner.leaves.map((leaf, index) => (
          <Leaf
            key={`${corner.cornerClass}-${index}`}
            className={`tree-leaf absolute ${leaf.className}`}
            style={{
              '--leaf-delay': leaf.delay,
              color: leaf.color,
              fill: leaf.color,
            }}
            strokeWidth={1.6}
          />
        ))}
      </div>
    ))}
  </div>
)

export default LeafyCorners
