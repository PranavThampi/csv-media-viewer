import React, { useState, ChangeEvent } from "react";
import { Upload, Table, Image } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Papa from "papaparse";

interface ValidationErrors {
  file?: string;
  urlColumn?: string;
}

interface CSVRow {
  [key: string]: string | number;
}

interface ParsedCSVData {
  data: string[][];
  errors: Papa.ParseError[];
  meta: Papa.ParseMeta;
}

const CSVMediaViewer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<CSVRow[]>([]);
  const [urlColumn, setUrlColumn] = useState<string>("");
  const [selectedRow, setSelectedRow] = useState<CSVRow | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [fileName, setFileName] = useState<string>("");

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!file) {
      errors.file = "Please upload a CSV file";
    }

    if (!urlColumn.trim()) {
      errors.urlColumn = "Please enter the URL column name";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>): void => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setValidationErrors((prev) => ({ ...prev, file: undefined }));
      // Reset data when new file is selected
      setData([]);
      setColumns([]);
      setSelectedRow(null);
    }
  };

  const handleUrlColumnChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setUrlColumn(e.target.value);
    setValidationErrors((prev) => ({ ...prev, urlColumn: undefined }));
  };

  const processCSV = (): void => {
    if (!file) return;

    setError("");
    setIsProcessing(true);

    Papa.parse(file, {
      complete: (results: ParsedCSVData) => {
        if (results.data && results.data.length > 0) {
          const headers = results.data[0];

          // Validate if the specified URL column exists
          if (!headers.includes(urlColumn)) {
            setError(
              `Column "${urlColumn}" not found in CSV file. Available columns: ${headers.join(
                ", "
              )}`
            );
            setIsProcessing(false);
            return;
          }

          setColumns(headers);
          const parsedData = results.data
            .slice(1)
            .filter((row) => row.some((cell) => cell))
            .map((row) => {
              return headers.reduce<CSVRow>((obj, header, index) => {
                obj[header] = row[index];
                return obj;
              }, {});
            });

          setData(parsedData);
        } else {
          setError("No data found in CSV file");
        }
        setIsProcessing(false);
      },
      error: (error: Papa.ParseError) => {
        setError(`Error parsing CSV: ${error.message}`);
        setIsProcessing(false);
      },
      header: false,
      skipEmptyLines: true,
      dynamicTyping: true,
    });
  };

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    processCSV();
  };

  const handleRowClick = (row: CSVRow): void => {
    setSelectedRow(row);
  };

  return (
    <div className="max-w-6xl mx-auto p-2 space-y-2 flex justify-center items-center flex-col">
      {/* Form Section */}
      <Card className="w-96">
        <CardHeader>
          <CardTitle>CSV Media Viewer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Upload CSV File</Label>
              <div className="mt-2">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    type="button"
                    className="relative"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {fileName && (
                    <span className="text-sm text-gray-500">{fileName}</span>
                  )}
                </div>
                {validationErrors.file && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.file}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="url-column">URL Column Name</Label>
              <Input
                id="url-column"
                type="text"
                value={urlColumn}
                onChange={handleUrlColumnChange}
                placeholder="Enter the column name containing URLs"
                className="mt-1"
              />
              {validationErrors.urlColumn && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.urlColumn}
                </p>
              )}
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? "Processing..." : "Process CSV"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Display Section */}
      {data.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="overflow-x-auto overflow-y-auto h-96">
              <table className="w-full">
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th key={column} className="text-left p-2 border-b">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, index) => (
                    <tr
                      key={index}
                      onClick={() => handleRowClick(row)}
                      className="hover:bg-gray-100 cursor-pointer"
                    >
                      {columns.map((column) => (
                        <td
                          key={column}
                          className="p-2 border-b truncate max-w-xs"
                        >
                          {row[column]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Row Details */}
      {selectedRow && urlColumn && (
        <Card>
          <CardHeader>
            <CardTitle>Media Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Media Preview */}
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                {selectedRow[urlColumn] ? (
                  <img
                    src={String(selectedRow[urlColumn])}
                    alt="Media preview"
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/api/placeholder/400/320";
                    }}
                  />
                ) : (
                  <Image className="w-12 h-12 text-gray-400" />
                )}
              </div>

              {/* Row Details */}
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(selectedRow)
                  .filter(([key]) => key !== urlColumn)
                  .map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <Label>{key}</Label>
                      <div className="p-2 bg-gray-50 rounded break-words">
                        {value}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CSVMediaViewer;
