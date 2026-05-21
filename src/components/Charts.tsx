"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const colors = ["#2f8f6b", "#2d7dd2", "#f0b85a", "#7e6bd8", "#e18a5a", "#79a97b", "#d94a45", "#5e9fa3"];

export function CategoryPieChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={84} paddingAngle={3}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${Number(value).toLocaleString("ja-JP")}円`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyTrendChart({ data }: { data: { month: string; income: number; spending: number }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8dcc8" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(value) => `${Math.round(Number(value) / 10000)}万`} />
          <Tooltip formatter={(value) => `${Number(value).toLocaleString("ja-JP")}円`} />
          <Line type="monotone" dataKey="income" name="収入" stroke="#2f8f6b" strokeWidth={3} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="spending" name="支出" stroke="#d94a45" strokeWidth={3} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RatioBarChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 24, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8dcc8" />
          <XAxis type="number" tickFormatter={(value) => `${Number(value).toFixed(0)}%`} />
          <YAxis dataKey="name" type="category" width={78} />
          <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
          <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#2d7dd2" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
