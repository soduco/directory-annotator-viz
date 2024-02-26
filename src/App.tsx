import './App.css';
import { DirectoryViewSelector } from './components/DirectoryListing';
import  CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import React, { useEffect, useState, useRef, useContext, Component } from 'react';
import { AppBar, Typography, Toolbar, Button, Icon } from '@mui/material';
import { Box } from '@mui/system';
import { CircularProgress } from '@mui/material';
import {AppContextInterface, AppContext} from "./components/ApplicationContext"

import { MainComponent } from './components/MainComponent';
import DownloadIcon from '@mui/icons-material/Download';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { useQuery, useQueryClient, QueryClient, QueryClientProvider} from 'react-query'
import { getAnnotations, setAnnotations } from './API';
import { AxiosError } from 'axios';

import { ReactQueryDevtools } from 'react-query/devtools'
import { UploadFile } from '@mui/icons-material';

const darkTheme = createTheme({
  palette: {
    mode: 'light',
  },
});

const drawerWidth = 240;

const queryClient = new QueryClient();


function AppActionBar() {

  const ctx = useContext(AppContext);
  const [fileDownloadUrl, setFileDownloadUrl] = useState<string>("");
  const dlElement = useRef<HTMLAnchorElement>(null);

  function updateData(e: React.MouseEvent) {
    if (!ctx)
      return;

    const annotations = Array.from(ctx.annotations);
    const data = JSON.stringify(annotations, null, 2);
    const blob = new Blob([data]);                   
    setFileDownloadUrl(URL.createObjectURL(blob));
  }


  // The hidden anchor element:
  return (
    <Box sx={{display : "flex", gap: 1}}>
    <a
         onClick={updateData}
         download={ctx ? (ctx.directory + "-" + ctx.view + ".json") : ""}
         href={fileDownloadUrl}
         ref={dlElement}
    >
    <Button variant="contained" startIcon={<DownloadIcon />} color="secondary">
      Export
    </Button>
    </a>
    <Button variant="contained" startIcon={<FileUploadIcon />} color="secondary" onClick={() => ctx && setAnnotations(ctx.directory, ctx.view, ctx.annotations)}>
      Save
    </Button>
    </Box>
  );
}




function Main() {
  const queryParams = new URLSearchParams(window.location.search);
  const qDirectory = queryParams.get("directory") || undefined;
  const qCurrentViewStr = queryParams.get("view");
  const qCurrentView = qCurrentViewStr ? parseInt(qCurrentViewStr) : undefined;


  const [currentDirectory, setCurrentDirectory] = useState<string>();
  const [currentView, setCurrentView] = useState<number>();

  // Queries
  const query = useQuery(['annotations', currentDirectory, currentView],
   () => getAnnotations(currentDirectory!, currentView!),
   { enabled: (currentDirectory != undefined && currentView != undefined),
     refetchOnWindowFocus: false,
    });


  useEffect(() => {
    qDirectory && setCurrentDirectory(qDirectory);
    qCurrentView && setCurrentView(qCurrentView); 
  }, []);



  // Display based on query status
  let main_content = null;
  if (query.isLoading)
    main_content = <><Typography variant="h6" component="div">Loading...</Typography><CircularProgress color="secondary"/></>;
  else if (query.isError) {
    let err = query.error as AxiosError;
    if (err.response?.status == 404)
      main_content = <Typography variant="h6" component="div">Error : Invalid page or annotations missing for this page.</Typography>;
    else
      main_content = <Typography variant="h6" component="div">Error : {err.message}</Typography>;
  }
  else if (query.isSuccess)
    main_content = <MainComponent />;

  return (
    <Box className="App" sx={{height: "100%", display: "flex", flexDirection: "column", overflow: "clip"}}>
       <AppContext.Provider value={ query.data ?
         { directory: currentDirectory!,
           view: currentView!, 
           annotations: query.data!
         } : null
       }>
      <ThemeProvider theme={darkTheme}>
      <CssBaseline enableColorScheme/>
      <AppBar position="static" sx={{ width: "100%", flexGrow: 0 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Directory Viewer
          </Typography>
          <DirectoryViewSelector initial_active_directory={qDirectory} initial_active_view={qCurrentView}
            onViewChanged={(d, v) => { 
              setCurrentDirectory(d);
              setCurrentView(v);
            }}/>
          <AppActionBar />
        </Toolbar>
      </AppBar>
      {main_content}
      </ThemeProvider>
      </AppContext.Provider>
    </Box>
  );
}

export function App() {
  return (
  <QueryClientProvider client={queryClient}>
    <ReactQueryDevtools initialIsOpen={false} />
    <Main />
  </QueryClientProvider>)
}

export default App;
