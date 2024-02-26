
## This file is used to set the environment variables for the front-end
## It is used by the Dockerfile to set the environment variables at runtime
cat <<EOF > /usr/share/nginx/html/runtime-env.js
    window._env_ = {
    REACT_APP_STORAGE_URI: "${SODUCO_EXTERNAL_STORAGE_URI}",
    REACT_APP_STORAGE_AUTH_TOKEN: "12345678",
    REACT_APP_COMPUTE_URI : "${SODUCO_EXTERNAL_COMPUTE_URI}",
    REACT_APP_COMPUTE_AUTH_TOKEN : "12345678"
    }
EOF

