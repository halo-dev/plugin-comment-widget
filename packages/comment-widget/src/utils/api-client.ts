import {
  ApiConsoleHaloRunV1alpha1UserApi,
  ApiHaloRunV1alpha1CommentApi,
} from "@halo-dev/api-client";
import axios, { AxiosError } from "axios";

const apiUrl = import.meta.env.VITE_API_URL;
const axiosInstance = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
});

interface ProblemDetail {
  detail: string;
  instance: string;
  status: number;
  title: string;
  type?: string;
}

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ProblemDetail>) => {
    if (/Network Error/.test(error.message)) {
      alert("网络错误，请检查网络连接");
      return Promise.reject(error);
    }

    const errorResponse = error.response;

    if (!errorResponse) {
      alert("网络错误，请检查网络连接");
      return Promise.reject(error);
    }

    const { title, detail } = errorResponse.data;

    if (title && detail) {
      alert([title, detail].join(": "));
    }

    return Promise.reject(error);
  }
);

const apiClient = {
  user: new ApiConsoleHaloRunV1alpha1UserApi(undefined, apiUrl, axiosInstance),
  comment: new ApiHaloRunV1alpha1CommentApi(undefined, apiUrl, axiosInstance),
};

export { apiClient };
