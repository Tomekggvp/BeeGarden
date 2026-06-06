import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import { BarChart3, Droplets } from 'lucide-react'
import { supabase } from '../services/supabaseClient'

dayjs.locale('ru')

const RANGE_OPTIONS = [
  { value: 'month', label: 'Месяц' },
  { value: 'week', label: 'Неделя' },
  { value: 'quarterDays', label: '3 месяца' },
  { value: 'year', label: 'Год' },
]

const CHART_WIDTH = 960
const CHART_HEIGHT = 420
const CHART_MARGIN = { top: 28, right: 20, bottom: 56, left: 58 }

const roundMaxVolume = (value) => {
  if (!value || value <= 0) return 10
  if (value <= 5) return 5
  if (value <= 10) return 10

  return Math.ceil(value / 5) * 5
}

const formatVolume = (value) =>
  `${Number(value || 0).toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })} л`

const formatMonthShort = (dateValue) =>
  new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(new Date(dateValue))

const formatMonthLong = (dateValue) =>
  new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(new Date(dateValue))

const formatWeekdayShort = (dateValue) =>
  new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(new Date(dateValue)).replace('.', '')

const formatMonthInputValue = (date) => dayjs(date).format('YYYY-MM')

const getIsoWeekInfo = (value) => {
  const [yearPart, weekPart] = String(value || '').split('-W')
  const year = Number.parseInt(yearPart, 10)
  const week = Number.parseInt(weekPart, 10)

  if (!Number.isFinite(year) || !Number.isFinite(week)) {
    return null
  }

  const januaryFourth = new Date(year, 0, 4)
  const day = januaryFourth.getDay() || 7
  const monday = new Date(januaryFourth)
  monday.setDate(januaryFourth.getDate() - day + 1 + (week - 1) * 7)

  return {
    year,
    week,
    start: dayjs(monday).startOf('day'),
    end: dayjs(monday).add(6, 'day').endOf('day'),
  }
}

const getWeekInputValue = (date) => {
  const current = dayjs(date).startOf('day')
  const nearestThursday = current.add(3 - ((current.day() + 6) % 7), 'day')
  const isoYear = nearestThursday.year()
  const firstThursday = dayjs(new Date(isoYear, 0, 4))
  const week = 1 + Math.round(
    nearestThursday.startOf('day').diff(firstThursday.add(3 - ((firstThursday.day() + 6) % 7), 'day').startOf('day'), 'day') / 7
  )

  return `${isoYear}-W${String(week).padStart(2, '0')}`
}

const formatAxisLabel = (dateValue, mode) => {
  const value = dayjs(dateValue)

  if (mode === 'year') {
    return formatMonthShort(value.toDate())
  }

  if (mode === 'week') {
    return formatWeekdayShort(value.toDate())
  }

  return value.format('D')
}

const formatBucketTitle = (bucket, mode) => {
  if (mode === 'year') {
    return formatMonthLong(dayjs(bucket.start).toDate())
  }

  return dayjs(bucket.start).format('DD.MM.YYYY')
}

const getAxisLabelStride = (rangeMode, bucketCount) => {
  if (rangeMode === 'week' || rangeMode === 'year') return 1
  if (rangeMode === 'month') {
    if (bucketCount > 30) return 4
    if (bucketCount > 24) return 3
    return 2
  }

  if (bucketCount > 80) return 14
  if (bucketCount > 60) return 10
  return 7
}

const buildRangeTitle = ({ rangeMode, monthValue, weekValue, yearValue, buckets }) => {
  if (!buckets.length) return ''

  if (rangeMode === 'month') {
    return formatMonthLong(new Date(`${monthValue}-01`))
  }

  if (rangeMode === 'week') {
    const info = getIsoWeekInfo(weekValue)
    if (!info) return ''

    const sameMonth = info.start.month() === info.end.month() && info.start.year() === info.end.year()
    if (sameMonth) {
      return `${info.start.format('D')}-${info.end.format('D')} ${formatMonthShort(info.start.toDate())}`
    }

    return `${info.start.format('D.MM')} - ${info.end.format('D.MM')}`
  }

  if (rangeMode === 'quarterDays') {
    return `${buckets[0].start.format('D.MM')} - ${buckets[buckets.length - 1].end.format('D.MM')}`
  }

  return yearValue
}

const buildBuckets = ({ rangeMode, monthValue, weekValue, yearValue }) => {
  if (rangeMode === 'month') {
    const start = dayjs(`${monthValue}-01`).startOf('month')
    const totalDays = start.daysInMonth()

    return Array.from({ length: totalDays }, (_, index) => {
      const bucketStart = start.add(index, 'day')
      return {
        key: bucketStart.format('YYYY-MM-DD'),
        label: bucketStart.format('DD.MM'),
        start: bucketStart.startOf('day'),
        end: bucketStart.endOf('day'),
      }
    })
  }

  if (rangeMode === 'week') {
    const isoWeekInfo = getIsoWeekInfo(weekValue)
    if (!isoWeekInfo) return []

    return Array.from({ length: 7 }, (_, index) => {
      const bucketStart = isoWeekInfo.start.add(index, 'day')
      return {
        key: bucketStart.format('YYYY-MM-DD'),
        label: bucketStart.format('DD.MM'),
        start: bucketStart.startOf('day'),
        end: bucketStart.endOf('day'),
      }
    })
  }

  if (rangeMode === 'quarterDays') {
    const end = dayjs().startOf('day')
    const start = end.subtract(89, 'day')
    const totalDays = end.diff(start, 'day') + 1

    return Array.from({ length: totalDays }, (_, index) => {
      const bucketStart = start.add(index, 'day')
      return {
        key: bucketStart.format('YYYY-MM-DD'),
        label: bucketStart.format('DD.MM'),
        start: bucketStart.startOf('day'),
        end: bucketStart.endOf('day'),
      }
    })
  }

  const start = dayjs(`${yearValue}-01-01`).startOf('year')
  return Array.from({ length: 12 }, (_, index) => {
    const bucketStart = start.add(index, 'month')
    return {
      key: bucketStart.format('YYYY-MM'),
      label: formatMonthShort(bucketStart.toDate()),
      start: bucketStart.startOf('month'),
      end: bucketStart.endOf('month'),
    }
  })
}

const buildChartData = ({ hives, records, buckets, rangeMode }) => {
  const bucketIndexByKey = new Map(buckets.map((bucket, index) => [bucket.key, index]))
  const hiveOrder = new Map(hives.map((hive, index) => [String(hive.id), index]))
  const volumeByHiveBucket = new Map()
  const recordCountByHive = new Map()
  const totalByHive = new Map()

  records.forEach((record) => {
    const hiveId = String(record.hive_id)
    const date = dayjs(record.pumping_date)
    const bucketKey = rangeMode === 'year'
      ? date.format('YYYY-MM')
      : date.format('YYYY-MM-DD')

    if (!bucketIndexByKey.has(bucketKey)) return

    const volume = Number(record.volume_liters) || 0
    const compoundKey = `${hiveId}:${bucketKey}`
    volumeByHiveBucket.set(compoundKey, (volumeByHiveBucket.get(compoundKey) || 0) + volume)
    totalByHive.set(hiveId, (totalByHive.get(hiveId) || 0) + volume)
    recordCountByHive.set(hiveId, (recordCountByHive.get(hiveId) || 0) + 1)
  })

  const bucketPoints = buckets.flatMap((bucket, bucketIndex) =>
    hives.map((hive) => {
      const hiveId = String(hive.id)
      const pointKey = `${hiveId}:${bucket.key}`
      const volume = volumeByHiveBucket.get(pointKey) || 0

      return {
        id: `${pointKey}:${bucketIndex}`,
        hiveId,
        hiveNumber: hive.number,
        bucketIndex,
        bucketLabel: bucket.label,
        bucketTitle: formatBucketTitle(bucket, rangeMode),
        value: volume,
        hasVolume: volume > 0,
        order: hiveOrder.get(hiveId) || 0,
      }
    })
  )

  const hiveSummaries = hives.map((hive) => {
    const hiveId = String(hive.id)

    return {
      hiveId,
      hiveNumber: hive.number,
      totalVolume: totalByHive.get(hiveId) || 0,
      recordCount: recordCountByHive.get(hiveId) || 0,
    }
  })

  return {
    bucketPoints,
    hiveSummaries,
    maxVolume: Math.max(...bucketPoints.map((point) => point.value), 0),
  }
}

const PumpingProductivityChart = ({ hives, points, buckets, maxVolume, rangeMode }) => {
  const innerWidth = CHART_WIDTH - CHART_MARGIN.left - CHART_MARGIN.right
  const innerHeight = CHART_HEIGHT - CHART_MARGIN.top - CHART_MARGIN.bottom
  const safeMaxVolume = roundMaxVolume(maxVolume)
  const bucketWidth = buckets.length > 1 ? innerWidth / (buckets.length - 1) : innerWidth
  const jitterRange = Math.min(24, Math.max(10, bucketWidth * 0.55))
  const labelStride = getAxisLabelStride(rangeMode, buckets.length)

  const xForIndex = (bucketIndex) => CHART_MARGIN.left + (buckets.length === 1 ? innerWidth / 2 : bucketIndex * bucketWidth)
  const yForValue = (value) => CHART_MARGIN.top + innerHeight - (value / safeMaxVolume) * innerHeight

  const gridValues = Array.from({ length: 5 }, (_, index) => {
    const value = (safeMaxVolume / 4) * index
    return Number(value.toFixed(1))
  }).reverse()

  return (
    <div className="rounded-lg border border-[#f1d88a] bg-[#fffdf7] p-3 shadow-sm sm:p-5">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="min-w-[760px]"
          role="img"
          aria-label="График продуктивности ульев по откачке мёда"
        >
          <defs>
            <linearGradient id="chartAreaGlow" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#f8b400" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#f8b400" stopOpacity="0" />
            </linearGradient>
          </defs>

          <rect
            x={CHART_MARGIN.left}
            y={CHART_MARGIN.top}
            width={innerWidth}
            height={innerHeight}
            fill="url(#chartAreaGlow)"
            rx="10"
          />

          {gridValues.map((value) => {
            const y = yForValue(value)

            return (
              <g key={value}>
                <line
                  x1={CHART_MARGIN.left}
                  y1={y}
                  x2={CHART_MARGIN.left + innerWidth}
                  y2={y}
                  stroke="#ecd79a"
                  strokeDasharray="5 7"
                />
                <text
                  x={CHART_MARGIN.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fontWeight="700"
                  fill="#7a5a1a"
                >
                  {Number.isInteger(value) ? value : value.toFixed(1)}
                </text>
              </g>
            )
          })}

          <line
            x1={CHART_MARGIN.left}
            y1={CHART_MARGIN.top + innerHeight}
            x2={CHART_MARGIN.left + innerWidth}
            y2={CHART_MARGIN.top + innerHeight}
            stroke="#8b4f00"
            strokeWidth="2"
          />
          <line
            x1={CHART_MARGIN.left}
            y1={CHART_MARGIN.top}
            x2={CHART_MARGIN.left}
            y2={CHART_MARGIN.top + innerHeight}
            stroke="#8b4f00"
            strokeWidth="2"
          />

          {buckets.map((bucket, index) => {
            const x = xForIndex(index)
            const shouldHideLabel = index % labelStride !== 0 && index !== buckets.length - 1

            return (
              <g key={bucket.key}>
                <line
                  x1={x}
                  y1={CHART_MARGIN.top + innerHeight}
                  x2={x}
                  y2={CHART_MARGIN.top + innerHeight + 6}
                  stroke="#8b4f00"
                  strokeWidth="1.5"
                />
                {!shouldHideLabel && (
                  <text
                    x={x}
                    y={CHART_MARGIN.top + innerHeight + 24}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="700"
                    fill="#7a5a1a"
                  >
                    {formatAxisLabel(bucket.start, rangeMode)}
                  </text>
                )}
              </g>
            )
          })}

          {points.map((point) => {
            const denominator = Math.max(hives.length - 1, 1)
            const offset = hives.length === 1
              ? 0
              : ((point.order / denominator) - 0.5) * jitterRange

            const x = xForIndex(point.bucketIndex) + offset
            const y = yForValue(point.value)
            const radius = point.hasVolume ? 13 : 4

            return (
              <g key={point.id}>
                <circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={point.hasVolume ? '#f8b400' : '#f5ddb1'}
                  stroke={point.hasVolume ? '#8b4f00' : '#d7b36b'}
                  strokeWidth={point.hasVolume ? 2.5 : 1.5}
                >
                  <title>
                    {`Улей №${point.hiveNumber}: ${formatVolume(point.value)} — ${point.bucketTitle}`}
                  </title>
                </circle>

                {point.hasVolume && (
                  <text
                    x={x}
                    y={y + 4}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="900"
                    fill="#2f2100"
                  >
                    {point.hiveNumber}
                  </text>
                )}
              </g>
            )
          })}

          <text
            x={CHART_MARGIN.left - 44}
            y={CHART_MARGIN.top - 6}
            fontSize="12"
            fontWeight="900"
            fill="#8b4f00"
          >
            литры
          </text>
          <text
            x={CHART_MARGIN.left + innerWidth}
            y={CHART_MARGIN.top + innerHeight + 46}
            textAnchor="end"
            fontSize="12"
            fontWeight="900"
            fill="#8b4f00"
          >
            время
          </text>
        </svg>
      </div>

      <p className="mt-3 text-sm font-semibold text-[#7a5a1a]">
        Яркие точки показывают объём откачки по ульям. Номер внутри точки — это номер домика.
      </p>
    </div>
  )
}

const Charts = ({ session, hives }) => {
  const [rangeMode, setRangeMode] = useState('month')
  const [monthValue, setMonthValue] = useState(() => formatMonthInputValue(new Date()))
  const [weekValue, setWeekValue] = useState(() => getWeekInputValue(new Date()))
  const [yearValue, setYearValue] = useState(() => String(new Date().getFullYear()))
  const [records, setRecords] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!session?.user?.id) return

    let isMounted = true

    const loadPumpings = async () => {
      setIsLoading(true)
      setErrorMessage('')

      const { data, error } = await supabase
        .from('honey_pumpings')
        .select('id, hive_id, pumping_date, volume_liters, created_at')
        .eq('user_id', session.user.id)
        .order('pumping_date', { ascending: true })
        .order('created_at', { ascending: true })

      if (!isMounted) return

      setIsLoading(false)

      if (error) {
        console.error('Load pumping chart data error:', error)
        setErrorMessage('Не удалось загрузить данные по откачке.')
        return
      }

      setRecords(data || [])
    }

    loadPumpings()

    return () => {
      isMounted = false
    }
  }, [session?.user?.id])

  const availableYears = useMemo(() => {
    const years = new Set([new Date().getFullYear()])
    records.forEach((record) => {
      const year = dayjs(record.pumping_date).year()
      if (Number.isFinite(year)) years.add(year)
    })

    return Array.from(years).sort((a, b) => b - a)
  }, [records])

  const effectiveYearValue = availableYears.includes(Number(yearValue))
    ? yearValue
    : String(availableYears[0] || new Date().getFullYear())

  const buckets = useMemo(
    () => buildBuckets({ rangeMode, monthValue, weekValue, yearValue: effectiveYearValue }),
    [effectiveYearValue, monthValue, rangeMode, weekValue]
  )

  const { filteredRecords, rangeTitle } = useMemo(() => {
    if (!buckets.length) {
      return {
        filteredRecords: [],
        rangeTitle: '',
      }
    }

    const rangeStart = buckets[0].start
    const rangeEnd = buckets[buckets.length - 1].end
    const nextRecords = records.filter((record) => {
      const pumpingDate = dayjs(record.pumping_date)
      return pumpingDate.isSame(rangeStart, 'day')
        || pumpingDate.isSame(rangeEnd, 'day')
        || (pumpingDate.isAfter(rangeStart) && pumpingDate.isBefore(rangeEnd))
    })

    return {
      filteredRecords: nextRecords,
      rangeTitle: buildRangeTitle({
        rangeMode,
        monthValue,
        weekValue,
        yearValue: effectiveYearValue,
        buckets,
      }),
    }
  }, [buckets, records, effectiveYearValue, monthValue, rangeMode, weekValue])

  const { bucketPoints, hiveSummaries, maxVolume } = useMemo(
    () => buildChartData({ hives, records: filteredRecords, buckets, rangeMode }),
    [buckets, filteredRecords, hives, rangeMode]
  )

  const totalVolume = useMemo(
    () => hiveSummaries.reduce((sum, hive) => sum + hive.totalVolume, 0),
    [hiveSummaries]
  )

  const activeHivesCount = useMemo(
    () => hiveSummaries.filter((hive) => hive.recordCount > 0).length,
    [hiveSummaries]
  )

  const renderFilterControl = () => {
    if (rangeMode === 'month') {
      return (
        <label className="grid gap-2 text-sm font-bold text-[#7a5a1a]">
          Выбранный месяц
          <input
            type="month"
            value={monthValue}
            onChange={(event) => setMonthValue(event.target.value)}
            className="rounded-lg border-2 border-[#f1d88a] bg-white px-4 py-3 font-semibold text-[#2f2100] outline-none transition-all focus:border-[#f8b400] focus:ring-4 focus:ring-[#f8b400]/20"
          />
        </label>
      )
    }

    if (rangeMode === 'week') {
      return (
        <label className="grid gap-2 text-sm font-bold text-[#7a5a1a]">
          Выбранная неделя
          <input
            type="week"
            value={weekValue}
            onChange={(event) => setWeekValue(event.target.value)}
            className="rounded-lg border-2 border-[#f1d88a] bg-white px-4 py-3 font-semibold text-[#2f2100] outline-none transition-all focus:border-[#f8b400] focus:ring-4 focus:ring-[#f8b400]/20"
          />
        </label>
      )
    }

    if (rangeMode === 'year') {
      return (
            <label className="grid gap-2 text-sm font-bold text-[#7a5a1a]">
          Выбранный год
          <select
            value={effectiveYearValue}
            onChange={(event) => setYearValue(event.target.value)}
            className="rounded-lg border-2 border-[#f1d88a] bg-white px-4 py-3 font-semibold text-[#2f2100] outline-none transition-all focus:border-[#f8b400] focus:ring-4 focus:ring-[#f8b400]/20"
          >
            {availableYears.map((year) => (
              <option key={year} value={String(year)}>
                {year}
              </option>
            ))}
          </select>
        </label>
      )
    }

    return (
      <div className="rounded-lg border border-[#f1d88a] bg-white px-4 py-3 text-sm font-semibold text-[#7a5a1a]">
        Показаны дни за текущие 3 месяца.
      </div>
    )
  }

  if (!hives.length) {
    return (
      <main className="min-h-[calc(100vh-56px)] px-4 pb-10 sm:px-6 lg:px-8">
        <section className="mx-auto w-full max-w-6xl pt-6">
          <div className="mb-6">
            <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-[#f8b400]/35 bg-[#fffaf0] px-3 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#9a5a00] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#f8b400]"></span>
              BeeGarden
            </div>
            <h1 className="font-['Tenor_Sans'] text-5xl leading-none text-[#2f2100] sm:text-7xl">
              Графики
            </h1>
          </div>

          <div className="rounded-lg border border-[#f1d88a] bg-[#fffaf0]/95 px-6 py-10 text-center shadow-sm">
            <p className="font-['Tenor_Sans'] text-4xl text-[#2f2100]">
              Пока нет ульев
            </p>
            <p className="mt-3 text-base font-semibold text-[#7a5a1a]">
              Добавьте домики на пасеку, и здесь появится график продуктивности по откачке мёда.
            </p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-56px)] px-4 pb-10 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-6xl pt-6">
        <div className="mb-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-[#f8b400]/35 bg-[#fffaf0] px-3 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#9a5a00] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f8b400]"></span>
            BeeGarden
          </div>
          <h1 className="font-['Tenor_Sans'] text-5xl leading-none text-[#2f2100] sm:text-7xl">
            Графики
          </h1>
          <p className="mt-3 max-w-3xl text-base font-semibold text-[#6f5a26]">
            Смотрите продуктивность каждого домика по откачке мёда: по неделям, месяцам, дням за текущие 3 месяца и по году.
          </p>
        </div>

        <div className="mb-5 grid gap-4 rounded-lg border border-[#f1d88a] bg-[#fffaf0]/95 p-4 shadow-sm lg:grid-cols-[1.4fr_0.9fr]">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#9a5a00]">
              Период
            </p>
            <div className="flex flex-wrap gap-2">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRangeMode(option.value)}
                  className={`rounded-lg px-4 py-2 text-sm font-black transition-all ${
                    rangeMode === option.value
                      ? 'bg-[#f8b400] text-[#2b1a00] shadow-sm'
                      : 'border border-[#f1d88a] bg-white text-[#8b4f00] hover:bg-[#fff4cc]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#9a5a00]">
              Настройка периода
            </p>
            {renderFilterControl()}
          </div>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-lg border border-[#f1d88a] bg-[#fffdf7] p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a5a00]">
              Интервал
            </p>
            <p className="mt-2 break-words text-base font-black text-[#2f2100] sm:text-lg">
              {rangeTitle || '—'}
            </p>
          </div>

          <div className="rounded-lg border border-[#f1d88a] bg-[#fffdf7] p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a5a00]">
              Общий объём
            </p>
            <div className="mt-2 inline-flex items-center gap-2 text-lg font-black text-[#2f2100]">
              <Droplets size={18} className="text-[#d99100]" />
              <span>{formatVolume(totalVolume)}</span>
            </div>
          </div>

          <div className="rounded-lg border border-[#f1d88a] bg-[#fffdf7] p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a5a00]">
              Домики с откачкой
            </p>
            <div className="mt-2 inline-flex items-center gap-2 text-lg font-black text-[#2f2100]">
              <BarChart3 size={18} className="text-[#d99100]" />
              <span>{activeHivesCount} из {hives.length}</span>
            </div>
          </div>

        </div>

        {errorMessage && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {errorMessage}
          </p>
        )}

        {isLoading ? (
          <div className="rounded-lg border border-[#f1d88a] bg-[#fffdf7] px-6 py-12 text-center shadow-sm">
            <p className="text-base font-semibold text-[#7a5a1a]">
              Загружаю данные по откачке...
            </p>
          </div>
        ) : (
          <>
            <PumpingProductivityChart
              hives={hives}
              points={bucketPoints}
              buckets={buckets}
              maxVolume={maxVolume}
              rangeMode={rangeMode}
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {hiveSummaries.map((hive) => (
                <div
                  key={hive.hiveId}
                  className="rounded-lg border border-[#f1d88a] bg-[#fffaf0]/95 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-['Tenor_Sans'] text-3xl leading-none text-[#2f2100]">
                      Улей №{hive.hiveNumber}
                    </p>
                    <span className="rounded-full bg-[#fff4cc] px-3 py-1 text-xs font-black text-[#8b4f00]">
                      {hive.recordCount ? `${hive.recordCount} запис.` : 'без откачки'}
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-semibold text-[#7a5a1a]">
                    Общий объём за период
                  </p>
                  <p className="mt-1 text-2xl font-black text-[#2f2100]">
                    {formatVolume(hive.totalVolume)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  )
}

export default Charts
