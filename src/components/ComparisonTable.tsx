import type { Cell, Comparison } from "@/data/compare";
import PriceTag from "./PriceTag";

function renderCell(c: Cell) {
  return typeof c === "string" ? c : <PriceTag id={c.price} compact />;
}

export default function ComparisonTable({ c }: { c: Comparison }) {
  // A table wider than the screen scrolls inside its own box; the box is focusable and named so keyboard users can scroll it.
  return (
    <div className="table-wrap glass my-8" role="region" aria-label="Comparison table" tabIndex={0}>
      <table className="cmp">
        <caption className="sr-only">
          {c.leftLabel} compared with {c.rightLabel}
        </caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">Detail</span>
            </th>
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
