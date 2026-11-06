'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { MonthlyCashFlow } from '@/lib/accounts'

const SERIES = [
  { key: 'income', name: 'Pemasukan', color: 'var(--chart-income)' },
  { key: 'expense', name: 'Pengeluaran', color: 'var(--chart-expense)' },
] as const

const compactAmount = new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 })

export default function CashFlowChart({ data }: { data: MonthlyCashFlow[] }) {
  const hasData = data.some((month) => month.income > 0 || month.expense > 0)

  if (!hasData) {
    return (
      <p className="py-16 text-center text-sm text-ink-muted">
        Belum ada transaksi dalam 6 bulan terakhir. Grafik muncul setelah transaksi pertama dicatat.
      </p>
    )
  }

  return (
    <>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-sm text-ink-muted">
        {SERIES.map((series) => (
          <li key={series.key} className="flex items-center gap-2">
            <span aria-hidden="true" className="size-3 rounded-sm" style={{ backgroundColor: series.color }} />
            {series.name}
          </li>
        ))}
      </ul>

      <div className="h-56" role="img" aria-label="Grafik batang pemasukan dan pengeluaran per bulan. Rinciannya ada di tabel di bawah grafik.">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={data} barGap={2} barCategoryGap="30%" margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis
              dataKey="label"
              interval={0}
              tickLine={false}
              axisLine={{ stroke: 'var(--line)' }}
              tick={{ fill: 'var(--color-ink-muted)', fontSize: 12 }}
            />
            <YAxis
              width={52}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => compactAmount.format(value)}
              tick={{ fill: 'var(--color-ink-muted)', fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: 'var(--line)', opacity: 0.4 }}
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--line)',
                borderRadius: 8,
                color: 'var(--color-ink)',
                fontSize: 13,
              }}
              labelStyle={{ color: 'var(--color-ink)', fontWeight: 600 }}
              itemStyle={{ color: 'var(--color-ink)' }}
            />
            {SERIES.map((series) => (
              <Bar
                key={series.key}
                dataKey={series.key}
                name={series.name}
                fill={series.color}
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-medium text-accent hover:text-accent-hover">Lihat sebagai tabel</summary>
        <div className="overflow-x-auto">
          <table className="w-full mt-2">
            <thead className="text-left text-ink-muted">
              <tr>
                <th scope="col" className="py-1 pr-4 font-medium">Bulan</th>
                <th scope="col" className="py-1 pr-4 font-medium text-right">Pemasukan</th>
                <th scope="col" className="py-1 font-medium text-right">Pengeluaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((month) => (
                <tr key={month.key}>
                  <th scope="row" className="py-1 pr-4 font-normal text-left">{month.label}</th>
                  <td className="py-1 pr-4 text-right whitespace-nowrap">{formatCurrency(month.income)}</td>
                  <td className="py-1 text-right whitespace-nowrap">{formatCurrency(month.expense)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  )
}
