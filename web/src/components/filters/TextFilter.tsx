import { TextField } from '@mui/material';

interface TextFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export const TextFilter = ({ value, onChange }: TextFilterProps) => {
  return (
    <TextField
      placeholder="Recherche..."
      variant="outlined"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      size="small"
      sx={{
        minWidth: { xs: '100%', sm: '120px' },
        flexGrow: { xs: 0, sm: 1 },
        '& .MuiInputBase-root': { height: { xs: '32px', sm: '40px' } },
      }}
    />
  );
};
