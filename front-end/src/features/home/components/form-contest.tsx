import { Button, Checkbox, Col, ColorPicker, DatePicker, Form, Input, Modal, Row, Upload } from 'antd';
import { format } from 'date-fns';
import { isEmpty } from 'lodash';
import { UploadIcon } from 'lucide-react';
import { SetStateAction, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCompetition } from '~/features/competition/hooks/use-competition';
import { useCreateCompetition } from '~/features/home/hooks/use-create-competition';
import { useGetInfoRequired } from '~/features/home/hooks/use-info-required';
import { useInfo } from '~/hooks/useInfo';
import { ICompetition } from '~/types';
import { UploadChangeParam, UploadFile } from 'antd/lib/upload/interface';
import moment from 'moment';
import { Color } from 'antd/es/color-picker';

const normFile = (e: { fileList: unknown }) => {
  if (Array.isArray(e)) {
    return e;
  }
  return e?.fileList;
};

export const FormContest = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [bannerUrl, setBannerUrl] = useState<string | undefined>('');
  const user = useInfo();
  const { mutate: createCompetition } = useCreateCompetition();
  const { data: competitionData } = useCompetition();
  const competition: ICompetition = competitionData?.data;
  const [form] = Form.useForm<ICompetition>();
  const [color] = useState<Color>();

  useEffect(() => {
    if (!competition || isEmpty(competition)) {
      return;
    }

    const { name, rules, timeEnd, timeStart, infoRequire, password, bannerUrl, themeColor } = competition;

    form.setFieldsValue({
      name,
      rules,
      // @ts-expect-error date
      timeStart: timeStart && moment(timeStart),
      // @ts-expect-error date
      timeEnd: timeEnd && moment(timeEnd),
      password,
      bannerUrl,
      themeColor
    });

    setSelectedValues(Array.isArray(infoRequire) ? infoRequire : infoRequire ? infoRequire.split(', ') : []);
  }, [competition, form]);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const onChange = (checkedValues: SetStateAction<string[]>) => {
    setSelectedValues(checkedValues);
  };

  const { data: listInfoRequired } = useGetInfoRequired();

  const handleUploadChange = (info: UploadChangeParam<UploadFile<{ data: SetStateAction<string | undefined> }>>) => {
    if (info.file.status === 'done') {
      setBannerUrl(info?.file?.response?.data);
    }
  };

  const handleSubmit = (data: ICompetition) => {
    const finalData = {
      ...data,
      id: parseInt(id as string),
      timeStart: format(new Date(data.timeStart), 'yyyy-MM-dd HH:mm:ss'),
      timeEnd: format(new Date(data.timeEnd), 'yyyy-MM-dd HH:mm:ss'),
      bannerUrl,
      infoRequire: selectedValues.join(', ')
    };

    createCompetition(finalData, {
      onSuccess: (response) => {
        const contestId = response?.data;
        navigate(`/dashboard/contest/${contestId}/edit?step=2`);
      }
    });
  };

  return (
    <>
      <Form form={form} layout='vertical' onFinish={handleSubmit}>
        <Form.Item label='Banner' valuePropName='fileList' getValueFromEvent={normFile}>
          <Upload
            headers={{
              Authorization: `Bearer ${user?.accessToken}`
            }}
            action={`${import.meta.env.VITE_DOMAIN_URL}/api/v1/competitions/upload-image`}
            listType='picture'
            onChange={handleUploadChange}
          >
            <Button className='w-[282px]' icon={<UploadIcon size={20} />}>
              Tải lên
            </Button>
          </Upload>
        </Form.Item>
        <Form.Item
          label='Tên cuộc thi'
          name='name'
          rules={[{ required: true, message: 'Vui lòng nhập tên đơn ban tổ chức!' }]}
        >
          <Input placeholder='Vui lòng nhập tên cuộc thi' defaultValue='Cuộc thi mới' />
        </Form.Item>
        <Form.Item label='Thể lệ' name='rules' rules={[{ required: true, message: 'Vui lòng nhập thể lệ cuộc thi!' }]}>
          <Input placeholder='Thể lệ cuộc thi..' defaultValue='Thể lệ cuộc thi' />
        </Form.Item>
        <Form.Item
          label='Ngày bắt đầu'
          name='timeStart'
          rules={[{ required: true, message: 'Vui lòng nhập thời gian bắt đầu!' }]}
        >
          <DatePicker placeholder='Chọn ngày bắt đầu' format='YYYY-MM-DD HH:mm:ss' />
        </Form.Item>
        <Form.Item
          label='Ngày kết thúc'
          name='timeEnd'
          rules={[{ required: true, message: 'Vui lòng nhập thời gian bắt đầu!' }]}
        >
          <DatePicker placeholder='Chọn ngày kết thúc' format='YYYY-MM-DD HH:mm:ss' />
        </Form.Item>
        <Form.Item label='Mật khẩu' name='password'>
          <Input.Password placeholder='Nhập mật khẩu cuộc thi...' />
        </Form.Item>
        <Form.Item label='Màu chủ đề' name='themeColor' initialValue={{ value: '#38a382' }}>
          <ColorPicker
            value={color}
            onChange={(_, hex) => {
              form.setFieldsValue({ themeColor: hex });
            }}
            showText
          />
        </Form.Item>
        <Form.Item label='Thông tin bắt buộc'>
          <Input value='Họ tên, Số điện thoại, Email' onClick={showModal} className='cursor-pointer bg-gray-200' />
        </Form.Item>

        <div className='mt-5 mb-2 flex justify-end gap-3'>
          <Button size='middle' htmlType='submit' type='primary'>
            Tiếp tục
          </Button>
        </div>
      </Form>
      <Modal
        title='Thông tin bắt buộc (Yêu cầu người tham dự nhập vào)'
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Checkbox.Group style={{ width: '100%' }} value={selectedValues} onChange={onChange}>
          <Row>
            {listInfoRequired?.data?.map((item: { id: number; label: string }) => (
              <Col span={12} key={item.id}>
                <Checkbox value={item.id}>{item.label}</Checkbox>
              </Col>
            ))}
          </Row>
        </Checkbox.Group>
      </Modal>
    </>
  );
};
