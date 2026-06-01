"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const colors = ["#2f8f6b", "#2d7dd2", "#f0b85a", "#7e6bd8", "#e18a5a", "#79a97b", "#d94a45", "#5e9fa3"];

function yen(value: unknown) {
  return `${Number(value).toLocaleString("ja-JP")}円`;
}

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
          <Tooltip formatter={yen} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyTrendChart({
  data
}: {
  data: { month: string; income: number; spending: number; remaining: number; saving: number; fixedCost: number; variableExpense: number }[];
}) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8dcc8" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(value) => `${Math.round(Number(value) / 10000)}万`} />
          <Tooltip formatter={yen} />
          <Legend />
          <Line type="monotone" dataKey="income" name="収入" stroke="#2f8f6b" strokeWidth={3} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="spending" name="支出" stroke="#d94a45" strokeWidth={3} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="remaining" name="残額" stroke="#2d7dd2" strokeWidth={3} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="saving" name="貯金・投資" stroke="#7e6bd8" strokeWidth={2} dot={{ r: 2 }} />
          <Line type="monotone" dataKey="fixedCost" name="固定費" stroke="#f0b85a" strokeWidth={2} dot={{ r: 2 }} />
          <Line type="monotone" dataKey="variableExpense" name="変動費" stroke="#e18a5a" strokeWidth={2} dot={{ r: 2 }} />
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
