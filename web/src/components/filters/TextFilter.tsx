import { TextField } from '@mui/material';

interface TextFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export const TextFilter = ({ value, onChange }: TextFilterProps) => {
  return (
    <TextField
      label="Filtrer par texte..."
      variant="outlined"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      size="small"
      sx={{
        flexGrow: 1,
        minWidth: { xs: '100%', sm: '200px' },
        '& .MuiInputBase-root': { height: { xs: '32px', sm: '40px' } },
        '& .MuiInputLabel-root': { top: { xs: '-5px', sm: '0px' } },
      }}
    />
  );
};
