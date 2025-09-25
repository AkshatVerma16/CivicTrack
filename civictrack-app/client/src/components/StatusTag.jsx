export default function StatusTag({ status }) {
  const color = status === 'Resolved'
    ? 'bg-green-100 text-green-800'
    : status === 'In Progress'
    ? 'bg-yellow-100 text-yellow-800'
    : 'bg-red-100 text-red-800'
  return <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${color}`}>{status}</span>
}


