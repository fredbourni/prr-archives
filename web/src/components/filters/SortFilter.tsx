import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import type { SortOrder } from '@hooks/useFilters';

interface SortFilterProps {
  value: SortOrder;
  onChange: (value: SortOrder) => void;
}

export const SortFilter = ({ value, onChange }: SortFilterProps) => {
  return (
    <FormControl
      size="small"
      sx={{
        minWidth: { xs: '130px', sm: '150px' },
        flexGrow: { xs: 1, sm: 0 },
        '& .MuiInputBase-root': { height: { xs: '32px', sm: '40px' } },
      }}
    >
      <InputLabel>Trier</InputLabel>
      <Select value={value} label="Trier" onChange={(e) => onChange(e.target.value as SortOrder)}>
        <MenuItem value="newest">Plus récents</MenuItem>
        <MenuItem value="oldest">Moins jeunes</MenuItem>
      </Select>
    </FormControl>
  );
};
