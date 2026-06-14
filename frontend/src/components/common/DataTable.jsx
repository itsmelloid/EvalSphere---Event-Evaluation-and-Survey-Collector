export default function DataTable({ columns, data, loading, emptyMsg = 'No data found.' }) {
  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!data?.length) return <div className="text-center py-16 text-slate-500 text-sm">{emptyMsg}</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead><tr>{columns.map(c => <th key={c.key} className="table-th">{c.label}</th>)}</tr></thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="table-row">
              {columns.map(c => <td key={c.key} className="table-td">{c.render ? c.render(row) : row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
