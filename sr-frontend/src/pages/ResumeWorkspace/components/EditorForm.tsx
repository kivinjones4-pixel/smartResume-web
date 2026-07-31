import { ThunderboltOutlined } from '@ant-design/icons'
import { Button, Form, Input, Select } from 'antd'
import type { BasicProfileValues } from '../../../types/Resume'
import type { ResumeModuleKey } from '../../../types/ResumeWorkspace'

const { TextArea } = Input

type EditorFormProps = {
  moduleKey: ResumeModuleKey
  form: ReturnType<typeof Form.useForm<BasicProfileValues>>[0]
  hasSelectedResume: boolean
}

export default function EditorForm({
  moduleKey,
  form,
  hasSelectedResume,
}: EditorFormProps) {
  if (moduleKey === 'profile') {
    return (
      <Form form={form} layout="vertical" requiredMark>
        <Form.Item
          label="真实姓名"
          name="full_name"
          rules={[{ required: true, whitespace: true, message: '请输入真实姓名' }]}
        >
          <Input placeholder="请输入真实姓名" maxLength={100} />
        </Form.Item>
        <Form.Item
          label="性别"
          name="gender"
          rules={[{ required: true, message: '请选择性别' }]}
        >
          <Select
            placeholder="请选择性别"
            options={[
              { value: 'male', label: '男' },
              { value: 'female', label: '女' },
              { value: 'other', label: '其他' },
              { value: 'undisclosed', label: '不愿透露' },
            ]}
          />
        </Form.Item>
        {hasSelectedResume && (
          <Form.Item
            label="求职方向"
            name="target_position"
            rules={[{ required: true, whitespace: true, message: '请输入求职方向' }]}
          >
            <Input placeholder="例如：高级产品经理" maxLength={150} />
          </Form.Item>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Form.Item label="联系电话" name="contact_phone">
            <Input placeholder="联系电话" />
          </Form.Item>
          <Form.Item label="所在城市" name="location">
            <Input placeholder="所在城市" />
          </Form.Item>
        </div>
        <Form.Item
          label="联系邮箱"
          name="contact_email"
          rules={[{ type: 'email', message: '请输入有效的联系邮箱' }]}
        >
          <Input placeholder="联系邮箱" />
        </Form.Item>
        <Form.Item label="职业标题" name="headline">
          <Input placeholder="例如：6 年经验的 AI 产品经理" />
        </Form.Item>
        <Form.Item
          label="GitHub URL"
          name="github_url"
          rules={[{ type: 'url', message: '请输入有效的 GitHub URL' }]}
        >
          <Input placeholder="https://github.com/username" />
        </Form.Item>
        <Form.Item
          label="个人网站 URL"
          name="website_url"
          rules={[{ type: 'url', message: '请输入有效的网站 URL' }]}
        >
          <Input placeholder="https://example.com" />
        </Form.Item>
        <Form.Item label="出生日期" name="birth_date">
          <Input type="date" />
        </Form.Item>
        <Form.Item label="个人优势" name="summary">
          <TextArea rows={7} placeholder="介绍你的经验、优势和职业亮点" />
        </Form.Item>
      </Form>
    )
  }

  const fieldMap: Record<Exclude<ResumeModuleKey, 'profile'>, [string, string, string]> = {
    education: ['学校名称', '华南理工大学', '专业与学历'],
    internship: ['公司名称', '字节跳动', '实习岗位'],
    work: ['公司名称', '智云科技', '工作岗位'],
    project: ['项目名称', 'AI 智能简历平台', '担任角色'],
    award: ['奖项名称', '全国大学生创新创业大赛金奖', '颁发机构'],
  }
  const [nameLabel, nameValue, roleLabel] = fieldMap[moduleKey]

  return (
    <Form layout="vertical" requiredMark={false}>
      <Form.Item label={nameLabel}>
        <Input defaultValue={nameValue} />
      </Form.Item>
      <Form.Item label={roleLabel}>
        <Input defaultValue={moduleKey === 'education' ? '计算机科学 · 本科' : '产品负责人'} />
      </Form.Item>
      <div className="grid grid-cols-2 gap-3">
        <Form.Item label="开始时间">
          <Input type="month" />
        </Form.Item>
        <Form.Item label="结束时间">
          <Input type="month" />
        </Form.Item>
      </div>
      <Form.Item label="经历描述">
        <TextArea
          rows={8}
          defaultValue="负责核心产品规划与落地，通过用户研究和数据分析持续优化关键路径，推动业务目标高质量达成。"
        />
      </Form.Item>
      <Button block icon={<ThunderboltOutlined />}>
        AI 帮我润色
      </Button>
    </Form>
  )
}
