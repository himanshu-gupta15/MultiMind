import proxy from "express-http-proxy";

export const proxyWithHeader = (serviceUrl, options = {}) => {
    return (req, res, next) => {
        const isMultipart = req.is("multipart/form-data");
        return proxy(serviceUrl, {
            parseReqBody: !isMultipart,
            limit: "50mb",
            proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
                if (srcReq.user) {
                    proxyReqOpts.headers["x-user-id"] = String(srcReq.user.userId || srcReq.user._id || "");
                }
                return proxyReqOpts;
            },
            ...options
        })(req, res, next);
    };
};