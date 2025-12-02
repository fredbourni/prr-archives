import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

interface YearFilterProps {
  value: string;
  years: (string | number)[];
  onChange: (value: string) => void;
}

export const YearFilter = ({ value, years, onChange }: YearFilterProps) => {
  return (
    <FormControl
      size="small"
      sx={{
        minWidth: { xs: '100px', sm: '120px' },
        flexGrow: { xs: 1, sm: 0 },
        '& .MuiInputBase-root': { height: { xs: '32px', sm: '40px' } },
      }}
    >
      <InputLabel>Année</InputLabel>
      <Select value={value} label="Année" onChange={(e) => onChange(e.target.value)}>
        {years.map((year) => (
          <MenuItem key={year} value={year}>
            {year}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
