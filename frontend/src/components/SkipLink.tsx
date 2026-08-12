interface SkipLinkProps {
  label: string;
  targetId: string;
}

export function SkipLink({ label, targetId }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      onClick={(event) => {
        event.preventDefault();
        document.getElementById(targetId)?.focus();
      }}
      style={{
        background: "#ffffff",
        border: "2px solid currentColor",
        left: 8,
        padding: 8,
        position: "fixed",
        top: -80,
        zIndex: 2000,
      }}
      onFocus={(event) => {
        event.currentTarget.style.top = "8px";
      }}
      onBlur={(event) => {
        event.currentTarget.style.top = "-80px";
      }}
    >
      {label}
    </a>
  );
}
