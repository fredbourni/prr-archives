import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Avatar,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import { DEFAULT_CATEGORY } from '@constants';

interface CategoryFilterProps {
  value: string;
  categories: string[];
  categoryImages: Map<string, string>;
  onChange: (value: string) => void;
}

export const CategoryFilter = ({
  value,
  categories,
  categoryImages,
  onChange,
}: CategoryFilterProps) => {
  return (
    <FormControl
      size="small"
      sx={{
        minWidth: { xs: '120px', sm: '200px' },
        flexGrow: { xs: 1, sm: 0 },
        '& .MuiInputBase-root': { height: { xs: '32px', sm: '40px' } },
      }}
    >
      <InputLabel>Show</InputLabel>
      <Select
        value={value}
        label="Show"
        onChange={(e) => onChange(e.target.value)}
        renderValue={(selectedValue) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedValue === DEFAULT_CATEGORY ? (
              <GridViewIcon sx={{ width: 20, height: 20 }} />
            ) : (
              categoryImages.has(selectedValue) && (
                <Avatar src={categoryImages.get(selectedValue)} sx={{ width: 20, height: 20 }} />
              )
            )}
            <span>{selectedValue}</span>
          </Box>
        )}
      >
        {categories.map((cat) => (
          <MenuItem key={cat} value={cat}>
            {cat === DEFAULT_CATEGORY ? (
              <ListItemIcon>
                <GridViewIcon sx={{ width: 24, height: 24, mr: 1 }} />
              </ListItemIcon>
            ) : (
              categoryImages.has(cat) && (
                <ListItemIcon>
                  <Avatar src={categoryImages.get(cat)} sx={{ width: 24, height: 24, mr: 1 }} />
                </ListItemIcon>
              )
            )}
            <ListItemText>{cat}</ListItemText>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
