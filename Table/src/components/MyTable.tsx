import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputNumber } from 'primereact/inputnumber';
import { Paginator, PaginatorPageChangeEvent } from 'primereact/paginator';
import { DataTable, DataTableValueArray, DataTableSelectionMultipleChangeEvent } from 'primereact/datatable';
import 'primeicons/primeicons.css';


interface ColumnMeta {
    field: string;
    header: string;
}

const MyTable = (): JSX.Element => {

    const apiUrl = import.meta.env.VITE_API;
    const rowClick: boolean = true;
    const [totalPages, setTotalPages] = useState(10);
    const [products, setProducts] = useState<DataTableValueArray>([]);
    const [selectedProducts, setSelectedProducts] = useState<DataTableValueArray>([]);
    const [inputNumValue, setInputNumValue] = useState(1);
    const op = useRef<OverlayPanel>(null);
    const [first, setFirst] = useState<number>(1);
    const [rows, _] = useState<number>(12);


    useEffect((): void => {
        const LoadTable = async (): Promise<void> => {
            try {
                await axios.get(apiUrl + '/artworks?page=1')
                    .then(res => {
                        setProducts(res.data.data)
                        setTotalPages(res.data.pagination.total_pages);
                    })
                    .catch((err: any): never => { throw new Error(err) });
            } catch (error) {
                throw new Error(`${error}`)
            }
        }
        LoadTable();
    }, [])

    const onPageChange = (event: PaginatorPageChangeEvent): void => {


        axios.get(apiUrl + `artworks?page=${event.page + 1}`)
            .then(res => {
                setProducts(res.data.data);
                setTotalPages(res.data.pagination.total_pages);
            })
            .catch((err: any): never => { throw new Error(err) });
        setFirst(event.first);
    };

    function handleProductSelection(e: DataTableSelectionMultipleChangeEvent<[]>): void {
        setSelectedProducts(e.value);
    }

    function handleNumInput(e: any): void {
        setInputNumValue(e.value)
    }


    const handleSubmitButton = async (): Promise<void> => {
        if (inputNumValue <= 0) {
            return;
        }

        op.current?.hide();
        const rowsPerPage = rows;
        const pagesNeeded = Math.ceil(inputNumValue / rowsPerPage);

        try {

            const pageNumbers = Array.from({ length: pagesNeeded }, (_: unknown, i: number) => i + 1);

            const responses = await Promise.all(
                pageNumbers.map((page: number): Promise<{ page: number; data: any }> =>
                    axios
                        .get(apiUrl + `/artworks?page=${page}`)
                        .then((res) => ({ page, data: res.data.data }))
                )
            );

            const sortedResponses = responses.sort((a: { page: number; data: any }, b: { page: number; data: any }): number => a.page - b.page);
            const combinedData = sortedResponses.flatMap((res: { page: number; data: any }) => res.data);
            const rowsToSelect = Math.min(inputNumValue, combinedData.length);
            setSelectedProducts(combinedData.slice(0, rowsToSelect));

        } catch (error) {
            throw new Error(`${error}`);

        }
    };



    const columns: ColumnMeta[] = [

        { field: "title", header: "Title" },
        { field: "place_of_origin", header: "Place of origin" },
        { field: "inscriptions", header: "Inscriptions" },
        { field: "artist_display", header: "Artist display" },
        { field: "date_start", header: "Date start" },
        { field: "date_end", header: "Date end" }
    ];

    return (
        <React.Fragment >
            <i className="pi pi-chevron-down" onClick={(e: React.MouseEvent<HTMLElement>): void => op.current?.toggle(e)} style={{ color: 'var(--gray-400)', position: 'absolute', translate: '3.2rem 1.7rem', zIndex: 2 }} />

            <OverlayPanel ref={op} showCloseIcon closeOnEscape dismissable={false} style={{ display: 'flex', height: 'max-content', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', columnGap: 10 }} >
                <InputNumber value={inputNumValue} useGrouping={false} onValueChange={handleNumInput} />
                <Button label='Submit'
                    style={{ display: 'flex', margin: '0.5rem auto', width: '15.3rem' }}
                    onClick={handleSubmitButton}
                />
            </OverlayPanel>

            <DataTable value={products}
                selectionMode={rowClick ? null : 'checkbox'}
                selection={selectedProducts}
                onSelectionChange={handleProductSelection}
                dataKey="id" tableStyle={{ minWidth: '50rem' }}>

                <Column selectionMode="multiple" headerStyle={{ width: '4rem' }} ></Column>
                {columns.map((col: ColumnMeta, _: unknown) => (
                    <Column key={col.field} field={col.field} header={col.header} />
                ))}
            </DataTable>

            <div className="card">
                <Paginator first={first} rows={rows} totalRecords={totalPages} onPageChange={onPageChange} />
            </div>
        </React.Fragment >
    )
}
export default MyTable;


