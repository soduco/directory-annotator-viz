import React, { useEffect, useState } from "react";
import { Button, MenuItem, Select, Input, FormControl, InputLabel, SelectChangeEvent} from "@mui/material";
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import { getDirectoryList, getPagesCount } from "../API";
import { useQuery } from "react-query";
import { isNull } from "underscore";
import { AxiosError } from "axios";
import CircularProgress from "@mui/material/CircularProgress"


interface DirectoryViewSelectorProps {
    initial_active_directory?: string;
    initial_active_view?: number;
    onViewChanged?(dir: string, view: number): void;
  }

export function DirectoryViewSelector(props: DirectoryViewSelectorProps) {
    const theme = useTheme();

    const [active_directory, setActiveDirectory] = useState<string | null>(props.initial_active_directory ?? null);
    const [active_view, setActiveView] = useState<number | null>(props.initial_active_view ?? null)
   

    function onActiveDirectoryChange(e: SelectChangeEvent<string>) {
        setActiveDirectory(e.target.value);
        setActiveView(null);
    };



    const query_dirs = useQuery("directories", getDirectoryList);
    const query_page_count = useQuery(["pagecount", active_directory], () => getPagesCount(active_directory!), {
      enabled: !isNull(active_directory)
    });

    function onViewChanged(view: number)
    {
        view = Math.min(Math.max(1, view), query_page_count.data!);
        setActiveView(view);

        if (!props.onViewChanged)
            return;
        console.log("Directory changed to: ", active_directory, ' page=', view);
        props.onViewChanged(active_directory!, view);
    }



    if (query_dirs.isError) {
      let err = query_dirs.error as AxiosError;
      return <Typography variant="h6" component="div">Error : {err.message}</Typography>;
    } else if (query_dirs.isLoading) {
      return <><Typography variant="h6" component="div">Loading...</Typography><CircularProgress color="secondary"/></>;
    } else {
        return (
            <Box sx={{ display: "flex", flexDirection: "row" }}>
            <Box sx={{ maxWidth: 200, m: [3, 0, 2, 2] }}>
                <FormControl fullWidth>
                <InputLabel id="directory-selector-label">Directory</InputLabel>
                <Select id="directory-selector" label="Directory" onChange={onActiveDirectoryChange} value={active_directory ?? ''}>
                { query_dirs.data?.map(item => <MenuItem key={item} value={item}>{item}</MenuItem>) }
                </Select>
                </FormControl>
            </Box>
            <Box
                component="form"
                sx={{
                    display: (active_directory) ? 'flex' : 'none',
                    alignItems: 'center'
                }}
                onSubmit={ (e: React.FormEvent) => { 
                    onViewChanged(active_view!);
                    e.preventDefault();
                }}
                >
                <IconButton aria-label="previous" onClick={() => onViewChanged(active_view! - 1)}>
                  {theme.direction === 'rtl' ? <SkipNextIcon /> : <SkipPreviousIcon />}
                </IconButton>
                <Input sx={{
                    width: 50,
                    height: 30,
                    textAlign: "center"
                    }}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActiveView(Number(e.target.value))}
                    value={active_view ?? ""}
                    onBlur={(e : any) => onViewChanged(active_view!)}
                    />
                <IconButton aria-label="next" onClick={() => onViewChanged(active_view! + 1)}>
                  {theme.direction === 'rtl' ? <SkipPreviousIcon /> : <SkipNextIcon />}
                </IconButton>
            </Box>
            </Box>
        );
    }
}
