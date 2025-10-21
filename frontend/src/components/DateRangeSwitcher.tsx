type Props = {
  value: 1 | 7 | 30;
  onChange: (v: 1 | 7 | 30) => void;
};


export default function DateRangeSwitcher({ value, onChange }: Props) {
  return (<>
    <p>Select range</p>
    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      {[1, 7, 30].map((v) => (
        <button
          key={v}
          onClick={() => onChange(v as 1 | 7 | 30)}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ddd",
            background: value === v ? "#99cffcff" : "white",
            cursor: "pointer",
          }}
        >
          {v} day{v > 1 ? "s" : ""}
        </button>
      ))}
    </div>
  </>
  );
}