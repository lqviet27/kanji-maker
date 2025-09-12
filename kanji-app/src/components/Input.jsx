import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import 'bootstrap/dist/css/bootstrap.min.css'
import { useState } from 'react';
import axios from 'axios';
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const Input = () => {
    const [onPDF, setOnPDF] = useState(false);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [numRows, setNumRows] = useState(1);
 
    const handleSubmit = async () => {
        setLoading(true);
        setPdfUrl(null);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:6969';
            const response = await axios.post(`${API_URL}/generate-pdf`, { text, numRows }, { responseType: 'blob' });
            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
            setPdfUrl(blobUrl);
            setOnPDF(true);
        } catch (error) {
            console.error('Error processing kanji:', error);
        }
        setLoading(false);
    }

    const handleDownload = () => {
        if (!pdfUrl) return;
        
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.setAttribute('download', 'kanji-guide.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    return (
        <Container fluid className='mt-4 px-4'>
            <h1 className='mb-4 text-center'>Kanji Practice Generator</h1>
            <Row className="h-100">
                {/* Left Column - Input Form */}
                <Col md={5} className="border-end pe-4">
                    <div className="sticky-top" style={{ top: '20px' }}>
                        <h3 className='mb-3 text-primary'>Nhập từ vựng </h3>
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Nếu nhập nhiều từ vựng thì ngăn cách bởi dấu ";"</Form.Label>
                                <Form.Control 
                                    as="textarea" 
                                    rows={8}
                                    className="form-control-lg"
                                    placeholder="Nhập từ vựng tại đây..."
                                    onChange={(e) => setText(e.target.value)}
                                    value={text}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3 d-flex">
                                <Form.Label className="ml-3">Số dòng luyện tập</Form.Label>
                                <InputGroup >
                                    <Form.Control 
                                        type="number" 
                                        min={1} 
                                        max={10} 
                                        value={numRows} 
                                        onChange={(e) => setNumRows(Math.max(1, Math.min(10, e.target.value)))}
                                    />
                                    <InputGroup.Text>Dòng</InputGroup.Text>
                                </InputGroup>
                            </Form.Group>


                            <div className="d-grid gap-2 mb-4">
                                <Button 
                                    variant="primary" 
                                    size="lg"
                                    onClick={handleSubmit}
                                    disabled={loading || !text.trim()}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        'Tạo PDF'
                                    )}
                                </Button>
                            </div>

                            {onPDF && pdfUrl && (
                                <div className="d-grid">
                                    <Button variant="success" onClick={handleDownload} size="lg">
                                        <i className="bi bi-download me-2"></i>
                                        Tải xuống PDF
                                    </Button>
                                </div>
                            )}
                        </Form>
                    </div>
                </Col>

                {/* Right Column - PDF Preview */}
                <Col md={7} className="ps-4">
                    <div>
                        {onPDF && pdfUrl ? (
                            <>
                                <h3 className="mb-3 text-primary">Preview PDF</h3>
                                <div 
                                    className="border rounded shadow-sm bg-light"
                                    style={{ 
                                        height: '70vh',
                                        overflowY: 'auto',
                                        padding: '10px'
                                    }}
                                >
                                    <Document
                                        file={pdfUrl}
                                        onLoadSuccess={onDocumentLoadSuccess}
                                        loading={
                                            <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
                                                <div className="text-center">
                                                    <div className="spinner-border text-primary mb-2" role="status"></div>
                                                    <p>Đang load preview...</p>
                                                </div>
                                            </div>
                                        }
                                    >
                                        {Array.from(new Array(numPages), (el, index) => (
                                            <div key={`page_${index + 1}`} className="mb-3 text-center">
                                                <Page 
                                                    pageNumber={index + 1} 
                                                    width={Math.min(window.innerWidth * 0.65, 800)}
                                                    renderTextLayer={false}
                                                    renderAnnotationLayer={false}
                                                />
                                                <small className="text-muted">Trang {index + 1} / {numPages}</small>
                                            </div>
                                        ))}
                                    </Document>
                                </div>
                            </>
                        ) : (
                            <div className="d-flex justify-content-center align-items-center" style={{ height: '70vh' }}>
                                <div className="text-center text-muted">
                                    <i className="bi bi-file-earmark-pdf display-1 mb-3"></i>
                                    <h4>Preview PDF</h4>
                                    <p>Nhập văn bản và nhấn "Tạo PDF" để xem preview</p>
                                </div>
                            </div>
                        )}
                    </div>
                </Col>
            </Row>
        </Container>
    );
}

export default Input;