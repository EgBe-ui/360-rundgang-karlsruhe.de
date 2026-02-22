export function SearchBar({ value, onInput, placeholder = 'Suchen...' }) {
  return (
    <input
      type="search"
      class="search-input"
      placeholder={placeholder}
      value={value}
      onInput={(e) => onInput(e.target.value)}
    />
  );
}
