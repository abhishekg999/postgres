"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface ResultsTableProps {
  columns: string[]
  data: any[]
}

export default function ResultsTable({ columns, data }: ResultsTableProps) {
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const rowsPerPage = 10

  // Filter data based on search term
  const filteredData = searchTerm
    ? data.filter((row) =>
        Object.values(row).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
      )
    : data

  const totalPages = Math.ceil(filteredData.length / rowsPerPage)
  const paginatedData = filteredData.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  const formatCellValue = (value: any) => {
    if (value === null) return <span className="text-[#A0AEC0] italic">NULL</span>
    if (typeof value === "object") return JSON.stringify(value)
    return String(value)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-2 border-b border-[#2D3748]">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-[#A0AEC0]" />
          <Input
            placeholder="Search results..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(1) // Reset to first page on search
            }}
            className="pl-8 bg-[#2D3748] border-[#4A5568] text-white placeholder:text-[#A0AEC0] h-9"
          />
        </div>
      </div>

      {/* Results Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="bg-[#1E293B] sticky top-0 z-10">
            <TableRow className="hover:bg-transparent border-[#2D3748]">
              {columns.map((column) => (
                <TableHead key={column} className="font-semibold text-[#E2E8F0]">
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow className="hover:bg-transparent border-[#2D3748]">
                <TableCell colSpan={columns.length} className="h-24 text-center text-[#A0AEC0]">
                  {searchTerm ? "No matching results found." : "No results."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className={`
                    hover:bg-[#2D3748] border-[#2D3748]
                    ${rowIndex % 2 === 0 ? "bg-[#1A202C]" : "bg-[#1E293B]"}
                  `}
                >
                  {columns.map((column) => (
                    <TableCell key={`${rowIndex}-${column}`} className="font-mono text-sm text-[#E2E8F0]">
                      {formatCellValue(row[column])}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="py-2 border-t border-[#2D3748] bg-[#1A202C] flex-shrink-0">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(page - 1)}
                  className={`
                    ${page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    text-[#E2E8F0] hover:bg-[#2D3748]
                  `}
                />
              </PaginationItem>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber: number

                if (totalPages <= 5) {
                  pageNumber = i + 1
                } else if (page <= 3) {
                  pageNumber = i + 1
                } else if (page >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i
                } else {
                  pageNumber = page - 2 + i
                }

                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      onClick={() => handlePageChange(pageNumber)}
                      isActive={page === pageNumber}
                      className={`
                        cursor-pointer
                        ${page === pageNumber ? "bg-[#10B981] text-white" : "text-[#E2E8F0] hover:bg-[#2D3748]"}
                      `}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(page + 1)}
                  className={`
                    ${page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    text-[#E2E8F0] hover:bg-[#2D3748]
                  `}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}

