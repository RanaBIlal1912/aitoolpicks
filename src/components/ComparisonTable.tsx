import type { Cell, Comparison } from "@/data/compare";
import PriceTag from "./PriceTag";

function renderCell(c: Cell) {
  return typeof c === "string" ? c : <PriceTag id={c.price} compact />;
}

export default function ComparisonTable({ c }: { c: Comparison }) {
  return (
    <div className="table-wrap glass my-8">
      <table className="cmp">
        <caption className="sr-only">
          {c.leftLabel} compared with {c.rightLabel}
        </caption>
        <thead>
          <tr>
            <th scope="col">&nbsp;</th>
            <th scope="col">{c.leftLabel}</th>
            <th scope="col">{c.rightLabel}</th>
          </tr>
        </thead>
        <tbody>
          {c.rows.map((r) => (
            <tr key={r.label}>
              <th scope="row">{r.label}</th>
              <td>{renderCell(r.left)}</td>
              <td>{renderCell(r.right)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
