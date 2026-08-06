import { Input, Modal } from 'antd'

type VisitorAccessGateProps = {
  code: string
  open: boolean
  unlocking: boolean
  onCodeChange: (code: string) => void
  onCancel: () => void
  onUnlock: () => void
}

export default function VisitorAccessGate({
  code,
  open,
  unlocking,
  onCodeChange,
  onCancel,
  onUnlock,
}: VisitorAccessGateProps) {
  return (
    <>
      <div className="grid min-h-screen place-items-center text-slate-400">
        正在验证访问权限…
      </div>
      <Modal
        title="请输入专属访客码"
        open={open}
        closable={false}
        maskClosable={false}
        okText="进入简历"
        cancelText="返回首页"
        confirmLoading={unlocking}
        okButtonProps={{ disabled: code.length !== 6 }}
        onCancel={onCancel}
        onOk={onUnlock}
      >
        <Input.OTP length={6} value={code} onChange={onCodeChange} />
      </Modal>
    </>
  )
}
